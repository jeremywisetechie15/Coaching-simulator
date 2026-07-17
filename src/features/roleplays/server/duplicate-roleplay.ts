import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import { QUIZ_PARTICIPATION, QUIZ_PARTICIPATIONS, type QuizParticipation } from "@/features/evaluations/domain";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRoleplay } from "./create-roleplay";
import { fetchRoleplayDetail } from "./roleplay-query";
import { getScenarioAiInstructions } from "./scenario-ai-context";

interface ScenarioQuizLinkRow {
    participation: string | null;
    quiz_id: string;
}

type DuplicateRoleplaySource = Pick<
    RoleplayDetail,
    | "assignedUserId"
    | "category"
    | "coachId"
    | "context"
    | "description"
    | "difficulty"
    | "disc"
    | "domain"
    | "groupId"
    | "methodId"
    | "objective"
    | "obstacles"
    | "organizationId"
    | "personaId"
    | "previewDescription"
    | "resources"
    | "scope"
    | "scorecardId"
>;

function normalizeQuizParticipation(value: string | null | undefined): QuizParticipation {
    return QUIZ_PARTICIPATIONS.includes(value as QuizParticipation)
        ? (value as QuizParticipation)
        : QUIZ_PARTICIPATION.optional;
}

export function buildDuplicateRoleplayInput({
    aiInstructions,
    duplicatePreviewTitle,
    duplicateTitle,
    quizRows,
    source,
}: {
    aiInstructions: string;
    duplicatePreviewTitle: string;
    duplicateTitle: string;
    quizRows: ScenarioQuizLinkRow[];
    source: DuplicateRoleplaySource;
}): SaveRoleplayDto {
    return {
        aiInstructions,
        assignedUserId: source.assignedUserId,
        backgroundImagePath: "",
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
        previewTitle: duplicatePreviewTitle,
        quizIds: quizRows.map((quiz) => quiz.quiz_id),
        quizParticipation: normalizeQuizParticipation(quizRows[0]?.participation),
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
        title: duplicateTitle,
    };
}

export async function duplicateRoleplay(roleplayId: string): Promise<RoleplayDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [source, aiInstructions] = await Promise.all([
        fetchRoleplayDetail(adminSupabase, roleplayId),
        getScenarioAiInstructions(adminSupabase, roleplayId),
    ]);
    const duplicateTitle = await resolveDuplicateName(adminSupabase, {
        column: "title",
        maxLength: 180,
        sourceName: source.title,
        table: "scenarios",
    });
    const duplicatePreviewTitle = source.previewTitle
        ? await resolveDuplicateName(adminSupabase, {
            column: "preview_title",
            maxLength: 180,
            sourceName: source.previewTitle,
            table: "scenarios",
        })
        : "";
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

    const input = buildDuplicateRoleplayInput({
        aiInstructions,
        duplicatePreviewTitle,
        duplicateTitle,
        quizRows: explicitQuizRows,
        source,
    });

    return createRoleplay(input);
}
