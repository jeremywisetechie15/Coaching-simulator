import { revalidatePath } from "next/cache";
import { requireAuth } from "@/features/auth/server";
import {
    roleplayCoachNotesArraySchema,
    type RoleplayCoachNotesContextInput,
    type SaveRoleplayCoachNotesInput,
} from "@/features/roleplays/dto";
import {
    ROLEPLAY_ROUTES,
    type RoleplayCoachMode,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createClient } from "@/lib/supabase/server";

interface CoachNotesRow {
    id: string;
    notes: unknown;
    saved_at: string;
}

interface CoachNotesListRow extends CoachNotesRow {
    coach_mode: RoleplayCoachMode;
    method_step_id: string | null;
    step_order: number;
}

interface MethodStepRow {
    id: string;
    method_id: string;
    step_order: number;
}

interface MethodStepTitleRow {
    id: string;
    title: string;
}

interface CoachNotesRoleplayRow {
    id: string;
    method_id: string | null;
}

export interface SavedRoleplayCoachNotes {
    savedAt: string;
}

export interface LoadedRoleplayCoachNotes {
    notes: SaveRoleplayCoachNotesInput["notes"];
    savedAt: string | null;
}

function revalidateRoleplayCoachNoteConsumers(roleplayId: string) {
    revalidatePath(ROLEPLAY_ROUTES.app.steps(roleplayId));
    revalidatePath(ROLEPLAY_ROUTES.app.session(roleplayId));
}

async function resolveMethodStep(
    adminSupabase: ReturnType<typeof createAdminClient>,
    roleplayMethodId: string | null,
    input: Pick<RoleplayCoachNotesContextInput, "methodStepId" | "stepOrder">,
) {
    if (!roleplayMethodId) {
        throw new ConflictError("Ce roleplay n'est associé à aucune méthode.");
    }

    let query = adminSupabase
        .from("method_steps")
        .select("id, method_id, step_order")
        .eq("method_id", roleplayMethodId)
        .eq("step_order", input.stepOrder);

    if (input.methodStepId) {
        query = query.eq("id", input.methodStepId);
    }

    const { data, error } = await query.maybeSingle<MethodStepRow>();

    if (error) throw error;
    if (!data) {
        throw new NotFoundError("L'étape sélectionnée n'appartient pas à la méthode du roleplay.");
    }

    return data;
}

async function resolveCoachNotesBaseContext(roleplayId: string) {
    const context = await requireAuth();
    const authenticatedSupabase = await createClient();
    const { data: roleplay, error } = await authenticatedSupabase
        .from("scenarios")
        .select("id, method_id")
        .eq("id", roleplayId)
        .maybeSingle<CoachNotesRoleplayRow>();

    if (error) throw error;
    if (!roleplay) throw new NotFoundError("Roleplay introuvable.");

    const adminSupabase = createAdminClient();

    return { adminSupabase, context, roleplay };
}

async function resolveCoachNotesContext(
    roleplayId: string,
    input: RoleplayCoachNotesContextInput,
) {
    const { adminSupabase, context, roleplay } = await resolveCoachNotesBaseContext(roleplayId);
    const methodStep = await resolveMethodStep(adminSupabase, roleplay.method_id, input);

    return { adminSupabase, context, methodStep, roleplay };
}

export function mapRoleplayCoachNoteGroups(
    rows: CoachNotesListRow[],
    stepTitlesById: ReadonlyMap<string, string>,
): RoleplayCoachNoteGroup[] {
    return rows.flatMap((row) => {
        const parsedNotes = roleplayCoachNotesArraySchema.safeParse(row.notes);
        if (!parsedNotes.success) {
            throw new Error("Les notes de préparation enregistrées sont invalides.");
        }
        if (parsedNotes.data.length === 0) return [];

        return [{
            coachMode: row.coach_mode,
            methodStepId: row.method_step_id,
            notes: parsedNotes.data,
            savedAt: row.saved_at,
            stepOrder: row.step_order,
            stepTitle:
                (row.method_step_id ? stepTitlesById.get(row.method_step_id) : null)
                ?? `Étape ${row.step_order}`,
        }];
    });
}

export async function listRoleplayCoachNotes(
    roleplayId: string,
): Promise<RoleplayCoachNoteGroup[]> {
    const { adminSupabase, context, roleplay } = await resolveCoachNotesBaseContext(roleplayId);
    const { data, error } = await adminSupabase
        .from("roleplay_coach_notes")
        .select("id, notes, saved_at, coach_mode, method_step_id, step_order")
        .eq("scenario_id", roleplay.id)
        .eq("user_id", context.userId)
        .order("step_order", { ascending: true })
        .returns<CoachNotesListRow[]>();

    if (error) throw error;

    const rows = data ?? [];
    const methodStepIds = Array.from(
        new Set(rows.flatMap((row) => row.method_step_id ? [row.method_step_id] : [])),
    );
    let stepTitlesById = new Map<string, string>();

    if (roleplay.method_id && methodStepIds.length > 0) {
        const { data: stepRows, error: stepError } = await adminSupabase
            .from("method_steps")
            .select("id, title")
            .eq("method_id", roleplay.method_id)
            .in("id", methodStepIds)
            .returns<MethodStepTitleRow[]>();

        if (stepError) throw stepError;
        stepTitlesById = new Map((stepRows ?? []).map((step) => [step.id, step.title]));
    }

    return mapRoleplayCoachNoteGroups(rows, stepTitlesById);
}

export async function getRoleplayCoachNotes(
    roleplayId: string,
    input: RoleplayCoachNotesContextInput,
): Promise<LoadedRoleplayCoachNotes> {
    const { adminSupabase, context, methodStep, roleplay } = await resolveCoachNotesContext(roleplayId, input);
    const { data, error } = await adminSupabase
        .from("roleplay_coach_notes")
        .select("id, notes, saved_at")
        .eq("scenario_id", roleplay.id)
        .eq("user_id", context.userId)
        .eq("method_step_id", methodStep.id)
        .eq("coach_mode", input.coachMode)
        .maybeSingle<CoachNotesRow>();

    if (error) throw error;
    if (!data) return { notes: [], savedAt: null };

    const notes = roleplayCoachNotesArraySchema.safeParse(data.notes);
    if (!notes.success) {
        throw new Error("Les notes de préparation enregistrées sont invalides.");
    }

    return { notes: notes.data, savedAt: data.saved_at };
}

export async function saveRoleplayCoachNotes(
    roleplayId: string,
    input: SaveRoleplayCoachNotesInput,
): Promise<SavedRoleplayCoachNotes> {
    const { adminSupabase, context, methodStep, roleplay } = await resolveCoachNotesContext(roleplayId, input);
    const savedAt = new Date().toISOString();

    const { data: existing, error: existingError } = await adminSupabase
        .from("roleplay_coach_notes")
        .select("id, notes, saved_at")
        .eq("scenario_id", roleplay.id)
        .eq("user_id", context.userId)
        .eq("method_step_id", methodStep.id)
        .eq("coach_mode", input.coachMode)
        .maybeSingle<CoachNotesRow>();

    if (existingError) throw existingError;

    if (existing) {
        const { error } = await adminSupabase
            .from("roleplay_coach_notes")
            .update({
                coach_mode: input.coachMode,
                method_step_id: methodStep.id,
                notes: input.notes,
                saved_at: savedAt,
                step_order: methodStep.step_order,
                updated_at: savedAt,
            })
            .eq("id", existing.id);

        if (error) throw error;
        revalidateRoleplayCoachNoteConsumers(roleplay.id);
        return { savedAt };
    }

    const { error } = await adminSupabase.from("roleplay_coach_notes").insert({
        coach_mode: input.coachMode,
        id: crypto.randomUUID(),
        method_step_id: methodStep.id,
        notes: input.notes,
        saved_at: savedAt,
        scenario_id: roleplay.id,
        step_order: methodStep.step_order,
        updated_at: savedAt,
        user_id: context.userId,
    });

    if (error) throw error;
    revalidateRoleplayCoachNoteConsumers(roleplay.id);
    return { savedAt };
}
