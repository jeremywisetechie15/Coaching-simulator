import { requireAuth } from "@/features/auth/server";
import {
    roleplayCoachNotesArraySchema,
    type RoleplayCoachNotesContextInput,
    type SaveRoleplayCoachNotesInput,
} from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createClient } from "@/lib/supabase/server";
import { fetchRoleplayDetail } from "./roleplay-query";

interface CoachNotesRow {
    id: string;
    notes: unknown;
    saved_at: string;
}

interface MethodStepRow {
    id: string;
    method_id: string;
    step_order: number;
}

export interface SavedRoleplayCoachNotes {
    savedAt: string;
}

export interface LoadedRoleplayCoachNotes {
    notes: SaveRoleplayCoachNotesInput["notes"];
    savedAt: string | null;
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

async function resolveCoachNotesContext(
    roleplayId: string,
    input: RoleplayCoachNotesContextInput,
) {
    const context = await requireAuth();
    const authenticatedSupabase = await createClient();
    const roleplay = await fetchRoleplayDetail(authenticatedSupabase, roleplayId, {
        statsUserId: context.userId,
    });
    const adminSupabase = createAdminClient();
    const methodStep = await resolveMethodStep(adminSupabase, roleplay.methodId, input);

    return { adminSupabase, context, methodStep, roleplay };
}

export async function getRoleplayCoachNotes(
    roleplayId: string,
    input: RoleplayCoachNotesContextInput,
): Promise<LoadedRoleplayCoachNotes> {
    const { adminSupabase, context, methodStep, roleplay } = await resolveCoachNotesContext(roleplayId, input);
    const { data, error } = await adminSupabase
        .from("roleplay_coach_notes")
        .select("id, notes, saved_at")
        .eq("scenario_id", roleplay.scenarioId)
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
        .eq("scenario_id", roleplay.scenarioId)
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
        return { savedAt };
    }

    const { error } = await adminSupabase.from("roleplay_coach_notes").insert({
        coach_mode: input.coachMode,
        id: crypto.randomUUID(),
        method_step_id: methodStep.id,
        notes: input.notes,
        saved_at: savedAt,
        scenario_id: roleplay.scenarioId,
        step_order: methodStep.step_order,
        updated_at: savedAt,
        user_id: context.userId,
    });

    if (error) throw error;
    return { savedAt };
}
