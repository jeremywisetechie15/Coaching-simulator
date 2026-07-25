import { requireAdmin } from "@/features/auth/server";
import { isSelectableContent, type ContentStatus } from "@/features/content/domain";
import {
    listContentTargetOptions,
    type ContentTargetCurrentSelection,
} from "@/features/content/server";
import { listQuizSelectionOptions } from "@/features/evaluations/server";
import { listMethodSelectionOptions } from "@/features/methods/server";
import { getCoachDetailById, listCoaches } from "@/features/coaches/server";
import { getPersonaDetailById, listPersonas } from "@/features/personas/server";
import type {
    RoleplayCoachOption,
    RoleplayGroupOption,
    RoleplayMethodOption,
    RoleplayOrganizationOption,
    RoleplayPersonaOption,
    RoleplayQuizOption,
    RoleplayScorecardOption,
    RoleplayUserOption,
} from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";

interface IncludeUnavailableIdsParams {
    includeUnavailableIds?: readonly string[];
}

interface ScorecardOptionRow {
    id: string;
    is_active: boolean | null;
    method_id: string;
    name: string;
    status: ContentStatus;
}

export async function listRoleplayPersonaOptions({
    includeUnavailableIds = [],
}: IncludeUnavailableIdsParams = {}): Promise<RoleplayPersonaOption[]> {
    const personas = await listPersonas();
    const personaById = new Map(personas.map((persona) => [persona.id, persona]));
    const missingIds = [...new Set(includeUnavailableIds)]
        .filter((personaId) => personaId && !personaById.has(personaId));

    if (missingIds.length > 0) {
        const currentPersonas = await Promise.all(missingIds.map((personaId) => getPersonaDetailById(personaId)));
        currentPersonas.forEach((persona) => {
            if (persona) personaById.set(persona.id, persona);
        });
    }

    return [...personaById.values()]
        .filter((persona) =>
            isSelectableContent(persona.status) || includeUnavailableIds.includes(persona.id)
        )
        .map((persona) => ({
            avatarUrl: persona.avatarUrl,
            company: persona.company,
            id: persona.id,
            isSelectable: isSelectableContent(persona.status),
            name: persona.name,
            role: persona.role,
        }));
}

export async function listRoleplayCoachOptions({
    includeUnavailableIds = [],
}: IncludeUnavailableIdsParams = {}): Promise<RoleplayCoachOption[]> {
    const coaches = await listCoaches();
    const coachById = new Map<string, Pick<(typeof coaches)[number], "id" | "name" | "status">>(
        coaches.map((coach) => [coach.id, coach]),
    );
    const missingIds = [...new Set(includeUnavailableIds)]
        .filter((coachId) => coachId && !coachById.has(coachId));

    if (missingIds.length > 0) {
        const currentCoaches = await Promise.all(missingIds.map((coachId) => getCoachDetailById(coachId)));
        currentCoaches.forEach((coach) => {
            if (coach) coachById.set(coach.id, coach);
        });
    }

    return [...coachById.values()]
        .filter((coach) =>
            isSelectableContent(coach.status) || includeUnavailableIds.includes(coach.id)
        )
        .map((coach) => ({
            id: coach.id,
            isSelectable: isSelectableContent(coach.status),
            name: coach.name,
        }));
}

export async function listRoleplayMethodOptions(
    params: IncludeUnavailableIdsParams = {},
): Promise<RoleplayMethodOption[]> {
    return listMethodSelectionOptions(params);
}

export async function listRoleplayQuizOptions({
    includeUnavailableIds = [],
}: IncludeUnavailableIdsParams = {}): Promise<RoleplayQuizOption[]> {
    const quizzes = await listQuizSelectionOptions({ includeUnavailableIds });

    return quizzes.map((quiz) => ({
        id: quiz.id,
        isSelectable: quiz.isSelectable,
        kind: quiz.kind,
        methodId: quiz.methodId,
        questionCount: quiz.questionCount,
        title: quiz.title,
    }));
}

export async function listRoleplayScorecardOptions({
    includeUnavailableIds = [],
}: IncludeUnavailableIdsParams = {}): Promise<RoleplayScorecardOption[]> {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("scorecards")
        .select("id, name, method_id, status, is_active")
        .order("name", { ascending: true })
        .returns<ScorecardOptionRow[]>();

    if (error) throw error;

    return (data ?? [])
        .filter((scorecard) =>
            isSelectableContent(scorecard.status, scorecard.is_active !== false)
            || includeUnavailableIds.includes(scorecard.id)
        )
        .map((scorecard) => ({
            id: scorecard.id,
            isSelectable: isSelectableContent(scorecard.status, scorecard.is_active !== false),
            methodId: scorecard.method_id,
            name: scorecard.name,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));
}

export async function listRoleplayTargetOptions(
    current: ContentTargetCurrentSelection = {},
): Promise<{
    groups: RoleplayGroupOption[];
    organizations: RoleplayOrganizationOption[];
    users: RoleplayUserOption[];
}> {
    return listContentTargetOptions(current);
}
