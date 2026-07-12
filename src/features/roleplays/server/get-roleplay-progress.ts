import { requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import {
    fetchCompletedQuizSkillCriteria,
    type QuizSkillCriterion,
} from "@/features/evaluations/server/quiz-skill-criteria";
import {
    buildRoleplayProgress,
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
    type ProgressBaselineCriterion,
    type ProgressBaselineStep,
    type ProgressCriterionResult,
    type ProgressSessionResult,
    type ProgressStepResult,
    type RoleplayProgress,
} from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";

interface SessionResultRow {
    completed_at: string | null;
    score_percent: number | string;
    session_id: string;
}

interface StepResultRow {
    coach_comment: string | null;
    points_awarded: number | string | null;
    points_max: number | string | null;
    score_percent: number | string;
    scorecard_step_id: string | null;
    session_id: string;
    step_order: number;
    title: string;
}

interface CriterionResultRow {
    advice: string | null;
    coach_comment: string | null;
    criterion_ref: string;
    dimension: string;
    dimension_item_id: string | null;
    points_awarded: number | string;
    points_max: number | string;
    score_percent: number | string;
    scorecard_step_id: string | null;
    session_id: string;
    skill_id: string | null;
}

interface BaselineScorecardStepRow {
    id: string;
    name: string;
    step_order: number;
}

interface BaselineScorecardCriterionRow {
    criterion_key: string;
    dimension: string;
    dimension_item_id: string | null;
    scorecard_step_id: string;
    skill_id: string | null;
}

interface BaselineMethodStepRow {
    id: string;
    short_title: string | null;
    step_order: number;
    title: string;
}

interface NamedRow {
    id: string;
    label?: string | null;
    name?: string | null;
}

interface ProgressQuizRow {
    id: string;
}

interface ScorecardStepMethodRow {
    id: string;
    method_step_id: string | null;
}

function toNumber(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchNames(table: "skills" | "skill_dimension_items", ids: string[], column: "name" | "label") {
    if (ids.length === 0) return new Map<string, string>();

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .in("id", ids)
        .returns<NamedRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, (row[column] as string | null | undefined) ?? ""]));
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function fetchScorecardBaseline(scorecardId: string): Promise<ProgressBaselineStep[]> {
    const supabase = createAdminClient();
    const { data: stepRows, error: stepsError } = await supabase
        .from("scorecard_steps")
        .select("id, step_order, name")
        .eq("scorecard_id", scorecardId)
        .order("step_order", { ascending: true })
        .returns<BaselineScorecardStepRow[]>();

    if (stepsError) throw stepsError;

    const steps = stepRows ?? [];
    const stepIds = steps.map((step) => step.id);
    if (stepIds.length === 0) return [];

    const { data: criteriaRows, error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .select("scorecard_step_id, criterion_key, skill_id, dimension, dimension_item_id")
        .in("scorecard_step_id", stepIds)
        .order("criterion_order", { ascending: true })
        .returns<BaselineScorecardCriterionRow[]>();

    if (criteriaError) throw criteriaError;

    const scorecardCriteria = criteriaRows ?? [];
    const [skillNamesById, dimensionItemLabelsById] = await Promise.all([
        fetchNames("skills", uniqueValues(scorecardCriteria.map((row) => row.skill_id)), "name"),
        fetchNames("skill_dimension_items", uniqueValues(scorecardCriteria.map((row) => row.dimension_item_id)), "label"),
    ]);
    const criteriaByStepId = new Map<string, ProgressBaselineCriterion[]>();

    for (const row of scorecardCriteria) {
        const criterion: ProgressBaselineCriterion = {
            criterionRef: row.criterion_key,
            dimension: row.dimension,
            dimensionItemId: row.dimension_item_id,
            dimensionItemLabel: row.dimension_item_id ? dimensionItemLabelsById.get(row.dimension_item_id) ?? null : null,
            skillId: row.skill_id,
            skillName: row.skill_id ? skillNamesById.get(row.skill_id) ?? null : null,
        };
        criteriaByStepId.set(row.scorecard_step_id, [...(criteriaByStepId.get(row.scorecard_step_id) ?? []), criterion]);
    }

    return steps.map((step) => ({
        criteria: criteriaByStepId.get(step.id) ?? [],
        scorecardStepId: step.id,
        stepOrder: step.step_order,
        title: step.name,
    }));
}

async function fetchMethodBaseline(methodId: string): Promise<ProgressBaselineStep[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("method_steps")
        .select("id, step_order, title, short_title")
        .eq("method_id", methodId)
        .order("step_order", { ascending: true })
        .returns<BaselineMethodStepRow[]>();

    if (error) throw error;

    return (data ?? []).map((step) => ({
        criteria: [],
        scorecardStepId: null,
        stepOrder: step.step_order,
        title: step.short_title || step.title,
    }));
}

async function fetchProgressBaseline(scorecardId?: string | null, methodId?: string | null) {
    if (scorecardId) {
        const scorecardBaseline = await fetchScorecardBaseline(scorecardId);
        if (scorecardBaseline.length > 0) return scorecardBaseline;
    }

    return methodId ? fetchMethodBaseline(methodId) : [];
}

async function fetchMethodKnowledgeQuizIds(
    supabase: ReturnType<typeof createAdminClient>,
    methodId?: string | null,
) {
    if (!methodId) return [];

    const methodQuizResult = await supabase
        .from("quizzes")
        .select("id")
        .eq("method_id", methodId)
        .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
        .eq("is_active", true)
        .neq("status", CONTENT_STATUS.archived)
        .returns<ProgressQuizRow[]>();

    if (methodQuizResult.error) throw methodQuizResult.error;

    return uniqueValues((methodQuizResult.data ?? []).map((row) => row.id));
}

async function fetchScorecardStepIdByMethodStepId(
    supabase: ReturnType<typeof createAdminClient>,
    scorecardId?: string | null,
) {
    if (!scorecardId) return new Map<string, string>();

    const { data, error } = await supabase
        .from("scorecard_steps")
        .select("id, method_step_id")
        .eq("scorecard_id", scorecardId)
        .returns<ScorecardStepMethodRow[]>();

    if (error) throw error;

    return new Map(
        (data ?? [])
            .filter((row): row is ScorecardStepMethodRow & { method_step_id: string } => Boolean(row.method_step_id))
            .map((row) => [row.method_step_id, row.id]),
    );
}

function mapQuizSkillCriteriaToProgressCriteria(
    rows: QuizSkillCriterion[],
    skillNamesById: Map<string, string>,
    dimensionItemLabelsById: Map<string, string>,
    scorecardStepIdByMethodStepId: Map<string, string>,
): ProgressCriterionResult[] {
    return rows.map((row, index) => ({
        advice: null,
        coachComment: null,
        completedAt: row.createdAt,
        criterionRef: `quiz:${row.quizId}:${row.sourceId}:${row.dimensionItemId ?? index}`,
        dimension: row.dimension,
        dimensionItemId: row.dimensionItemId,
        dimensionItemLabel: row.dimensionItemId ? dimensionItemLabelsById.get(row.dimensionItemId) ?? null : null,
        pointsAwarded: row.pointsAwarded,
        pointsMax: row.pointsMax,
        scorePercent: row.scorePercent,
        scorecardStepId: row.methodStepId ? scorecardStepIdByMethodStepId.get(row.methodStepId) ?? null : null,
        sessionId: row.sourceId,
        skillId: row.skillId,
        skillName: row.skillId ? skillNamesById.get(row.skillId) ?? null : null,
    }));
}

export async function getRoleplayProgress(
    roleplayId: string,
    title: string,
    scorecardId?: string | null,
    methodId?: string | null,
): Promise<RoleplayProgress> {
    const context = await requireAuth();
    const supabase = createAdminClient();

    const { data: sessionRows, error: sessionError } = await supabase
        .from("roleplay_session_results")
        .select("session_id, score_percent, completed_at, sessions!inner(duration_seconds)")
        .eq("scenario_id", roleplayId)
        .eq("user_id", context.userId)
        .gte("sessions.duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
        .order("completed_at", { ascending: true })
        .returns<SessionResultRow[]>();

    if (sessionError) throw sessionError;

    const sessions: ProgressSessionResult[] = (sessionRows ?? []).map((row) => ({
        completedAt: row.completed_at,
        scorePercent: toNumber(row.score_percent),
        sessionId: row.session_id,
    }));
    const baselineSteps = await fetchProgressBaseline(scorecardId, methodId);
    const [quizIds, scorecardStepIdByMethodStepId] = await Promise.all([
        fetchMethodKnowledgeQuizIds(supabase, methodId),
        fetchScorecardStepIdByMethodStepId(supabase, scorecardId),
    ]);
    const quizSkillCriteria = await fetchCompletedQuizSkillCriteria(supabase, {
        quizIds,
        userId: context.userId,
    });

    if (sessions.length === 0) {
        const [quizSkillNamesById, quizDimensionItemLabelsById] = await Promise.all([
            fetchNames("skills", uniqueValues(quizSkillCriteria.map((row) => row.skillId)), "name"),
            fetchNames("skill_dimension_items", uniqueValues(quizSkillCriteria.map((row) => row.dimensionItemId)), "label"),
        ]);

        return buildRoleplayProgress({
            baselineSteps,
            criteria: [],
            quizCriteria: mapQuizSkillCriteriaToProgressCriteria(
                quizSkillCriteria,
                quizSkillNamesById,
                quizDimensionItemLabelsById,
                scorecardStepIdByMethodStepId,
            ),
            sessions,
            steps: [],
            title,
        });
    }

    const sessionIds = sessions.map((session) => session.sessionId);
    const [stepResult, criterionResult] = await Promise.all([
        supabase
            .from("roleplay_session_step_results")
            .select("session_id, scorecard_step_id, step_order, title, score_percent, points_awarded, points_max, coach_comment")
            .in("session_id", sessionIds)
            .order("step_order", { ascending: true })
            .returns<StepResultRow[]>(),
        supabase
            .from("roleplay_session_criterion_results")
            .select("session_id, scorecard_step_id, criterion_ref, skill_id, dimension, dimension_item_id, score_percent, points_awarded, points_max, coach_comment, advice")
            .in("session_id", sessionIds)
            .returns<CriterionResultRow[]>(),
    ]);

    if (stepResult.error) throw stepResult.error;
    if (criterionResult.error) throw criterionResult.error;

    const criteriaRows = criterionResult.data ?? [];
    const [skillNamesById, dimensionItemLabelsById] = await Promise.all([
        fetchNames("skills", uniqueValues([
            ...criteriaRows.map((row) => row.skill_id),
            ...quizSkillCriteria.map((row) => row.skillId),
        ]), "name"),
        fetchNames("skill_dimension_items", uniqueValues([
            ...criteriaRows.map((row) => row.dimension_item_id),
            ...quizSkillCriteria.map((row) => row.dimensionItemId),
        ]), "label"),
    ]);

    const steps: ProgressStepResult[] = (stepResult.data ?? []).map((row) => ({
        coachComment: row.coach_comment,
        pointsAwarded: row.points_awarded === null ? null : toNumber(row.points_awarded),
        pointsMax: row.points_max === null ? null : toNumber(row.points_max),
        scorePercent: toNumber(row.score_percent),
        scorecardStepId: row.scorecard_step_id,
        sessionId: row.session_id,
        stepOrder: row.step_order,
        title: row.title,
    }));
    const criteria: ProgressCriterionResult[] = criteriaRows.map((row) => ({
        advice: row.advice,
        coachComment: row.coach_comment,
        criterionRef: row.criterion_ref,
        dimension: row.dimension,
        dimensionItemId: row.dimension_item_id,
        dimensionItemLabel: row.dimension_item_id ? dimensionItemLabelsById.get(row.dimension_item_id) ?? null : null,
        pointsAwarded: toNumber(row.points_awarded),
        pointsMax: toNumber(row.points_max),
        scorePercent: toNumber(row.score_percent),
        scorecardStepId: row.scorecard_step_id,
        sessionId: row.session_id,
        skillId: row.skill_id,
        skillName: row.skill_id ? skillNamesById.get(row.skill_id) ?? null : null,
    }));
    const quizCriteria = mapQuizSkillCriteriaToProgressCriteria(
        quizSkillCriteria,
        skillNamesById,
        dimensionItemLabelsById,
        scorecardStepIdByMethodStepId,
    );

    return buildRoleplayProgress({
        baselineSteps,
        criteria,
        quizCriteria,
        sessions,
        steps,
        title,
    });
}
