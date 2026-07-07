import type { SupabaseClient } from "@supabase/supabase-js";
import type { Evaluation } from "@/features/roleplays/data/evaluation";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import type { RoleplaySession } from "@/features/roleplays/data/sessions";
import { mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import {
    applyEvaluationSessionResults,
    extractNotationScore,
    mapNotationToEvaluation,
    type EvaluationSessionResults,
    type NotationTranscriptMessage,
} from "@/features/roleplays/domain";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRoleplayDetail } from "./roleplay-query";
import { formatRoleplayDuration } from "./roleplay.mapper";

interface SessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    scenario_id: string | null;
}

interface RoleplaySessionEvaluation {
    evaluation: Evaluation;
    roleplay: RoleplayItem;
    session: RoleplaySession;
}

interface SessionStepResultRow {
    coach_comment: string | null;
    points_awarded: number | string | null;
    points_max: number | string | null;
    score_percent: number | string;
    scorecard_step_id: string | null;
    step_order: number;
    title: string;
}

interface SessionCriterionResultRow {
    advice: string | null;
    coach_comment: string | null;
    criterion_ref: string;
    dimension_item_id: string | null;
    evidence: string | null;
    points_awarded: number | string;
    points_max: number | string;
    score_percent: number | string;
    scorecard_criterion_id: string | null;
    scorecard_step_id: string | null;
    skill_id: string | null;
}

interface ScorecardCriterionDefinitionRow {
    criterion_key: string;
    criterion_order: number;
    expected_evidence: string;
    id: string;
    verbatim: string | null;
}

interface NamedRow {
    id: string;
    label?: string | null;
    name?: string | null;
}

function formatSessionDate(value: string | null) {
    if (!value) return "Date inconnue";

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function toNumber(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function fetchNames(
    supabase: SupabaseClient,
    table: "skills" | "skill_dimension_items",
    ids: string[],
    column: "name" | "label",
) {
    if (ids.length === 0) return new Map<string, string>();

    const { data, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .in("id", ids)
        .returns<NamedRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, (row[column] as string | null | undefined) ?? ""]));
}

async function fetchScorecardCriterionDefinitions(
    supabase: SupabaseClient,
    ids: string[],
) {
    if (ids.length === 0) return new Map<string, ScorecardCriterionDefinitionRow>();

    const { data, error } = await supabase
        .from("scorecard_criteria")
        .select("id, criterion_order, criterion_key, expected_evidence, verbatim")
        .in("id", ids)
        .returns<ScorecardCriterionDefinitionRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, row]));
}

async function fetchEvaluationSessionResults(
    supabase: SupabaseClient,
    sessionId: string,
): Promise<EvaluationSessionResults> {
    const [stepResult, criterionResult] = await Promise.all([
        supabase
            .from("roleplay_session_step_results")
            .select("scorecard_step_id, step_order, title, score_percent, points_awarded, points_max, coach_comment")
            .eq("session_id", sessionId)
            .order("step_order", { ascending: true })
            .returns<SessionStepResultRow[]>(),
        supabase
            .from("roleplay_session_criterion_results")
            .select("scorecard_step_id, scorecard_criterion_id, criterion_ref, skill_id, dimension_item_id, score_percent, points_awarded, points_max, evidence, coach_comment, advice")
            .eq("session_id", sessionId)
            .returns<SessionCriterionResultRow[]>(),
    ]);

    if (stepResult.error) throw stepResult.error;
    if (criterionResult.error) throw criterionResult.error;

    const criterionRows = criterionResult.data ?? [];
    const [criteriaById, skillNamesById, dimensionItemLabelsById] = await Promise.all([
        fetchScorecardCriterionDefinitions(
            supabase,
            uniqueValues(criterionRows.map((row) => row.scorecard_criterion_id)),
        ),
        fetchNames(supabase, "skills", uniqueValues(criterionRows.map((row) => row.skill_id)), "name"),
        fetchNames(
            supabase,
            "skill_dimension_items",
            uniqueValues(criterionRows.map((row) => row.dimension_item_id)),
            "label",
        ),
    ]);

    return {
        criteria: criterionRows.map((row) => {
            const definition = row.scorecard_criterion_id ? criteriaById.get(row.scorecard_criterion_id) : null;

            return {
                advice: row.advice,
                coachComment: row.coach_comment,
                criterionKey: definition?.criterion_key ?? null,
                criterionOrder: definition?.criterion_order ?? null,
                criterionRef: row.criterion_ref,
                dimensionItemLabel: row.dimension_item_id ? dimensionItemLabelsById.get(row.dimension_item_id) ?? null : null,
                evidence: row.evidence,
                expectedEvidence: definition?.expected_evidence ?? null,
                pointsAwarded: toNumber(row.points_awarded),
                pointsMax: toNumber(row.points_max),
                scorePercent: toNumber(row.score_percent),
                scorecardStepId: row.scorecard_step_id,
                skillName: row.skill_id ? skillNamesById.get(row.skill_id) ?? null : null,
                verbatim: definition?.verbatim ?? null,
            };
        }),
        steps: (stepResult.data ?? []).map((row) => ({
            coachComment: row.coach_comment,
            pointsAwarded: row.points_awarded === null ? null : toNumber(row.points_awarded),
            pointsMax: row.points_max === null ? null : toNumber(row.points_max),
            scorePercent: toNumber(row.score_percent),
            scorecardStepId: row.scorecard_step_id,
            stepOrder: row.step_order,
            title: row.title,
        })),
    };
}

export async function getRoleplaySessionEvaluation(sessionId: string, userId?: string): Promise<RoleplaySessionEvaluation> {
    const supabase = createAdminClient();

    let query = supabase
        .from("sessions")
        .select("id, scenario_id, created_at, duration_seconds, notation_json")
        .eq("id", sessionId);

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data: session, error: sessionError } = await query.maybeSingle<SessionRow>();

    if (sessionError) throw sessionError;
    if (!session?.scenario_id) {
        throw new NotFoundError("Session de roleplay introuvable.");
    }

    const [roleplayDetail, messagesResult, sessionResults] = await Promise.all([
        fetchRoleplayDetail(supabase, session.scenario_id, userId),
        supabase
            .from("messages")
            .select("role, content, timestamp")
            .eq("session_id", session.id)
            .order("timestamp", { ascending: true })
            .returns<NotationTranscriptMessage[]>(),
        fetchEvaluationSessionResults(supabase, session.id),
    ]);

    if (messagesResult.error) throw messagesResult.error;

    const roleplay = mapDbRoleplayToUi(roleplayDetail);
    const score = extractNotationScore(session.notation_json) ?? roleplay.detail.scoreActuel ?? 0;

    const evaluation = applyEvaluationSessionResults(
        mapNotationToEvaluation(session.notation_json, messagesResult.data ?? []),
        sessionResults,
    );

    return {
        evaluation,
        roleplay,
        session: {
            date: formatSessionDate(session.created_at),
            duration: formatRoleplayDuration(session.duration_seconds),
            id: session.id,
            roleplayId: roleplay.id,
            score,
        },
    };
}
