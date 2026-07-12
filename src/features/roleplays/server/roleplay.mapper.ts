import {
    CONTENT_STATUS,
    normalizeContentStatus,
} from "@/features/content/domain";
import {
    QUIZ_PARTICIPATION,
    QUIZ_PARTICIPATIONS,
    QUIZ_TYPE,
    QUIZ_TYPES,
    type QuizParticipation,
    type QuizType,
} from "@/features/evaluations/domain";
import {
    normalizeRoleplayDifficulty,
    normalizeRoleplayDiscProfile,
    normalizeRoleplayVisibilityScope,
    type RoleplayDetail,
    type RoleplayListItem,
    type RoleplayResource,
    type RoleplayStats,
} from "@/features/roleplays/domain";

export interface RoleplayRow {
    assigned_user_id?: string | null;
    background_image_path?: string | null;
    assigned_user_name?: string | null;
    category?: string | null;
    coach_id?: string | null;
    coach_name?: string | null;
    coaching_steps?: string | null;
    context?: string | null;
    created_at?: string | null;
    description?: string | null;
    difficulty_level?: string | null;
    disc_profile?: string | null;
    domain?: string | null;
    group_id?: string | null;
    group_name?: string | null;
    id: string;
    is_active?: boolean | null;
    method_id?: string | null;
    method_name?: string | null;
    method_step_count?: number | null;
    notation_method_id?: string | null;
    objective?: string | null;
    obstacles?: string | null;
    organization_id?: string | null;
    organization_name?: string | null;
    persona_avatar_url?: string | null;
    persona_company?: string | null;
    persona_id: string;
    persona_name?: string | null;
    persona_role?: string | null;
    preview_description?: string | null;
    preview_title?: string | null;
    scorecard_id?: string | null;
    scorecard_name?: string | null;
    status?: string | null;
    title: string;
    updated_at?: string | null;
    visibility_scope?: string | null;
}

export interface ScenarioQuizRow {
    quiz_duration_minutes?: number | null;
    participation?: string | null;
    quiz_id: string;
    quiz_question_count?: number | null;
    quiz_title?: string | null;
    quiz_type?: string | null;
    scenario_id: string;
    sort_order: number;
}

export interface ScenarioResourceRow {
    bucket?: string | null;
    external_url?: string | null;
    id: string;
    label?: string | null;
    path?: string | null;
    resource_type?: string | null;
    scenario_id: string;
    sort_order: number;
}

function normalizeParticipation(value: string | null | undefined): QuizParticipation {
    return QUIZ_PARTICIPATIONS.includes(value as QuizParticipation)
        ? (value as QuizParticipation)
        : QUIZ_PARTICIPATION.optional;
}

function normalizeQuizType(value: string | null | undefined): QuizType {
    return QUIZ_TYPES.includes(value as QuizType) ? (value as QuizType) : QUIZ_TYPE.knowledge;
}

function normalizeResourceType(value: string | null | undefined): RoleplayResource["resourceType"] {
    if (value === "image" || value === "video" || value === "audio" || value === "link") {
        return value;
    }

    return "document";
}

export function formatRoleplayDuration(seconds: number | null | undefined) {
    const safeSeconds = seconds ?? 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    if (minutes <= 0) {
        return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

export function formatRoleplayDate(value: string | null | undefined) {
    if (!value) {
        return "Aucune session";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

export function mapRoleplayRowToListItem(row: RoleplayRow, quizCount = 0, attemptCount = 0): RoleplayListItem {
    return {
        assignedUserId: row.assigned_user_id ?? null,
        assignedUserName: row.assigned_user_name ?? null,
        backgroundImagePath: row.background_image_path ?? null,
        attemptCount,
        category: row.category ?? "",
        coachId: row.coach_id ?? null,
        coachName: row.coach_name ?? null,
        company: row.persona_company ?? "",
        description: row.description ?? "",
        previewDescription: row.preview_description ?? "",
        previewTitle: row.preview_title ?? "",
        difficulty: normalizeRoleplayDifficulty(row.difficulty_level),
        disc: normalizeRoleplayDiscProfile(row.disc_profile),
        domain: row.domain ?? "",
        groupId: row.group_id ?? null,
        groupName: row.group_name ?? null,
        id: row.id,
        isActive: row.is_active ?? true,
        methodId: row.method_id ?? null,
        methodName: row.method_name ?? null,
        name: row.persona_name ?? row.title,
        organizationId: row.organization_id ?? null,
        organizationName: row.organization_name ?? null,
        personaAvatarUrl: row.persona_avatar_url ?? null,
        personaId: row.persona_id,
        quizCount,
        role: row.persona_role ?? "",
        scope: normalizeRoleplayVisibilityScope(row.visibility_scope),
        scorecardId: row.scorecard_id ?? null,
        scorecardName: row.scorecard_name ?? null,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
        title: row.title,
        updatedAt: row.updated_at ?? null,
    };
}

export function mapRoleplayRowsToDetail(
    row: RoleplayRow,
    quizRows: ScenarioQuizRow[],
    resourceRows: ScenarioResourceRow[],
    stats: RoleplayStats,
): RoleplayDetail {
    const sortedQuizRows = quizRows.slice().sort((first, second) => first.sort_order - second.sort_order);
    const sortedResourceRows = resourceRows.slice().sort((first, second) => first.sort_order - second.sort_order);

    return {
        ...mapRoleplayRowToListItem(row, sortedQuizRows.length),
        coachingSteps: row.coaching_steps ?? "",
        context: row.context ?? "",
        createdAt: row.created_at ?? null,
        methodStepCount: row.method_step_count ?? 0,
        objective: row.objective ?? "",
        obstacles: row.obstacles ?? "",
        quizIds: sortedQuizRows.map((quiz) => quiz.quiz_id),
        quizzes: sortedQuizRows.map((quiz) => ({
            durationMinutes: quiz.quiz_duration_minutes ?? 30,
            id: quiz.quiz_id,
            participation: normalizeParticipation(quiz.participation),
            questionCount: quiz.quiz_question_count ?? 0,
            title: quiz.quiz_title ?? "Quiz",
            type: normalizeQuizType(quiz.quiz_type),
        })),
        resources: sortedResourceRows.map((resource) => ({
            externalUrl: resource.external_url ?? null,
            id: resource.id,
            label: resource.label ?? resource.path ?? resource.external_url ?? "Ressource",
            resourceType: normalizeResourceType(resource.resource_type),
            storageBucket: resource.bucket ?? null,
            storagePath: resource.path ?? null,
        })),
        scenarioId: row.id,
        stats: {
            bestScore: stats.bestScore,
            bestScoreDate: stats.bestScoreDate,
            indexDelta: stats.indexDelta,
            indexScore: stats.indexScore,
            indexSessions: stats.indexSessions,
            indexSessionCount: stats.indexSessionCount,
            indexTrend: stats.indexTrend,
            lastDate: stats.lastDate || formatRoleplayDate(null),
            lastDuration: stats.lastDuration || formatRoleplayDuration(0),
            latestEligibleSessionId: stats.latestEligibleSessionId,
            scoreActuel: stats.scoreActuel,
            simulations: stats.simulations,
        },
    };
}

export function createEmptyRoleplayStats(): RoleplayStats {
    return {
        bestScore: 0,
        bestScoreDate: formatRoleplayDate(null),
        indexDelta: null,
        indexScore: null,
        indexSessions: [],
        indexSessionCount: 0,
        indexTrend: "unavailable",
        lastDate: formatRoleplayDate(null),
        lastDuration: formatRoleplayDuration(0),
        latestEligibleSessionId: null,
        scoreActuel: 0,
        simulations: 0,
    };
}
