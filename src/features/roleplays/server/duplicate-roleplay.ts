import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_PARTICIPATION, QUIZ_PARTICIPATIONS, type QuizParticipation } from "@/features/evaluations/domain";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRoleplay } from "./create-roleplay";
import { fetchRoleplayDetail } from "./roleplay-query";

interface ScenarioQuizLinkRow {
    participation: string | null;
    quiz_id: string;
}

function normalizeQuizParticipation(value: string | null | undefined): QuizParticipation {
    return QUIZ_PARTICIPATIONS.includes(value as QuizParticipation)
        ? (value as QuizParticipation)
        : QUIZ_PARTICIPATION.optional;
}

export async function duplicateRoleplay(roleplayId: string): Promise<RoleplayDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const source = await fetchRoleplayDetail(adminSupabase, roleplayId);
    const { data: sourceQuizRows, error: sourceQuizError } = await adminSupabase
        .from("scenario_quizzes")
        .select("quiz_id, participation")
        .eq("scenario_id", roleplayId)
        .order("sort_order", { ascending: true })
        .returns<ScenarioQuizLinkRow[]>();

    if (sourceQuizError) {
        throw sourceQuizError;
    }

    const explicitQuizRows = sourceQuizRows ?? [];

    const input: SaveRoleplayDto = {
        assignedUserId: source.assignedUserId,
        category: source.category,
        coachId: source.coachId,
        context: source.context,
        description: source.description,
        difficulty: source.difficulty,
        disc: source.disc,
        domain: source.domain,
        groupId: source.groupId,
        methodId: source.methodId,
        objective: source.objective,
        obstacles: source.obstacles,
        organizationId: source.organizationId,
        personaId: source.personaId,
        previewDescription: source.previewDescription,
        previewTitle: source.previewTitle ? `Copie de ${source.previewTitle}` : "",
        quizIds: explicitQuizRows.map((quiz) => quiz.quiz_id),
        quizParticipation: normalizeQuizParticipation(explicitQuizRows[0]?.participation),
        resources: source.resources.map((resource) => ({
            clientFileId: "",
            externalUrl: resource.externalUrl ?? "",
            label: resource.label,
            resourceType: resource.resourceType,
            storageBucket: resource.storageBucket ?? "",
            storagePath: resource.storagePath ?? "",
        })),
        scope: source.scope,
        scorecardId: source.scorecardId,
        status: CONTENT_STATUS.draft,
        title: `Copie de ${source.title}`,
    };

    return createRoleplay(input);
}
