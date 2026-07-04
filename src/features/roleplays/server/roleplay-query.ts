import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import type { RoleplayDetail, RoleplayListItem, RoleplayStats } from "@/features/roleplays/domain";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    createEmptyRoleplayStats,
    formatRoleplayDuration,
    mapRoleplayRowsToDetail,
    mapRoleplayRowToListItem,
    type RoleplayRow,
    type ScenarioResourceRow,
    type ScenarioQuizRow,
} from "./roleplay.mapper";
import { mergeMethodKnowledgeQuizRow } from "./roleplay-preparation-quizzes";
import { ROLEPLAY_SELECT, SCENARIO_QUIZ_SELECT, SCENARIO_RESOURCE_SELECT } from "./roleplay.persistence";

interface PersonaRelationRow {
    avatar_url: string | null;
    company: string | null;
    id: string;
    name: string | null;
    role: string | null;
}

interface NamedRelationRow {
    id: string;
    name: string | null;
}

interface MethodRelationRow {
    code: string | null;
    id: string;
    name: string | null;
}

interface ProfileRelationRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
}

interface MethodStepCountRow {
    method_id: string | null;
}

interface QuizRelationRow {
    duration_minutes: number | null;
    id: string;
    quiz_type: string | null;
    title: string | null;
}

interface QuizStepRelationRow {
    id: string;
    quiz_id: string;
}

interface QuizQuestionRelationRow {
    step_id: string;
}

interface MethodKnowledgeQuizRow {
    id: string;
}

interface SessionStatsRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
}

interface RoleplaySessionResultStatsRow {
    completed_at: string | null;
    score_percent: number | string | null;
    session_id: string;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getProfileName(profile: ProfileRelationRow) {
    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    return fullName || profile.name || profile.email || "Utilisateur";
}

async function fetchPersonasById(supabase: SupabaseClient, ids: string[]) {
    if (ids.length === 0) return new Map<string, PersonaRelationRow>();

    const { data, error } = await supabase
        .from("personas")
        .select("id, name, role, company, avatar_url")
        .in("id", ids)
        .returns<PersonaRelationRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, row]));
}

async function fetchNamesById(supabase: SupabaseClient, table: "coaches" | "scorecards" | "organizations" | "groups", ids: string[]) {
    if (ids.length === 0) return new Map<string, string>();

    const { data, error } = await supabase
        .from(table)
        .select("id, name")
        .in("id", ids)
        .returns<NamedRelationRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, row.name ?? ""]));
}

async function fetchMethodsById(supabase: SupabaseClient, ids: string[]) {
    if (ids.length === 0) return new Map<string, MethodRelationRow>();

    const { data, error } = await supabase
        .from("methods")
        .select("id, name, code")
        .in("id", ids)
        .returns<MethodRelationRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, row]));
}

async function fetchProfilesById(supabase: SupabaseClient, ids: string[]) {
    if (ids.length === 0) return new Map<string, string>();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, name, first_name, last_name, email")
        .in("id", ids)
        .returns<ProfileRelationRow[]>();

    if (error) throw error;

    return new Map((data ?? []).map((row) => [row.id, getProfileName(row)]));
}

async function fetchMethodStepCounts(supabase: SupabaseClient, methodIds: string[]) {
    if (methodIds.length === 0) return new Map<string, number>();

    const { data, error } = await supabase
        .from("method_steps")
        .select("method_id")
        .in("method_id", methodIds)
        .returns<MethodStepCountRow[]>();

    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
        if (!row.method_id) continue;
        counts.set(row.method_id, (counts.get(row.method_id) ?? 0) + 1);
    }

    return counts;
}

async function fetchScenarioQuizzes(supabase: SupabaseClient, scenarioIds: string[]) {
    if (scenarioIds.length === 0) return [];

    const { data, error } = await supabase
        .from("scenario_quizzes")
        .select(SCENARIO_QUIZ_SELECT)
        .in("scenario_id", scenarioIds)
        .order("sort_order", { ascending: true })
        .returns<ScenarioQuizRow[]>();

    if (error) throw error;

    return data ?? [];
}

async function fetchScenarioResources(supabase: SupabaseClient, scenarioId: string) {
    const { data, error } = await supabase
        .from("scenario_resources")
        .select(SCENARIO_RESOURCE_SELECT)
        .eq("scenario_id", scenarioId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .returns<ScenarioResourceRow[]>();

    if (error) throw error;

    return data ?? [];
}

async function fetchMethodKnowledgeQuizId(supabase: SupabaseClient, methodId: string | null | undefined) {
    if (!methodId) return null;

    const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("method_id", methodId)
        .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
        .eq("is_active", true)
        .neq("status", CONTENT_STATUS.archived)
        .maybeSingle<MethodKnowledgeQuizRow>();

    if (error) throw error;

    return data?.id ?? null;
}

async function withQuizDetails(supabase: SupabaseClient, rows: ScenarioQuizRow[]) {
    const quizIds = uniqueValues(rows.map((row) => row.quiz_id));
    if (quizIds.length === 0) return rows;

    const { data, error } = await supabase
        .from("quizzes")
        .select("id, title, duration_minutes, quiz_type")
        .in("id", quizIds)
        .returns<QuizRelationRow[]>();

    if (error) throw error;

    const quizById = new Map((data ?? []).map((row) => [row.id, row]));
    const { data: stepRows, error: stepError } = await supabase
        .from("quiz_steps")
        .select("id, quiz_id")
        .in("quiz_id", quizIds)
        .returns<QuizStepRelationRow[]>();

    if (stepError) throw stepError;

    const stepIdToQuizId = new Map<string, string>();
    for (const step of stepRows ?? []) {
        stepIdToQuizId.set(step.id, step.quiz_id);
    }

    const quizQuestionCounts = new Map<string, number>();
    const stepIds = Array.from(stepIdToQuizId.keys());

    if (stepIds.length > 0) {
        const { data: questionRows, error: questionError } = await supabase
            .from("quiz_questions")
            .select("step_id")
            .in("step_id", stepIds)
            .returns<QuizQuestionRelationRow[]>();

        if (questionError) throw questionError;

        for (const question of questionRows ?? []) {
            const quizId = stepIdToQuizId.get(question.step_id);
            if (!quizId) continue;
            quizQuestionCounts.set(quizId, (quizQuestionCounts.get(quizId) ?? 0) + 1);
        }
    }

    return rows.map((row) => ({
        ...row,
        quiz_duration_minutes: quizById.get(row.quiz_id)?.duration_minutes ?? null,
        quiz_question_count: quizQuestionCounts.get(row.quiz_id) ?? 0,
        quiz_title: quizById.get(row.quiz_id)?.title ?? "Quiz",
        quiz_type: quizById.get(row.quiz_id)?.quiz_type ?? null,
    }));
}

async function withRoleplayRelations(rows: RoleplayRow[]) {
    if (rows.length === 0) return rows;

    const adminSupabase = createAdminClient();
    const personaIds = uniqueValues(rows.map((row) => row.persona_id));
    const coachIds = uniqueValues(rows.map((row) => row.coach_id));
    const methodIds = uniqueValues(rows.map((row) => row.method_id));
    const scorecardIds = uniqueValues(rows.map((row) => row.scorecard_id));
    const organizationIds = uniqueValues(rows.map((row) => row.organization_id));
    const groupIds = uniqueValues(rows.map((row) => row.group_id));
    const assignedUserIds = uniqueValues(rows.map((row) => row.assigned_user_id));

    const [
        personasById,
        coachNamesById,
        methodsById,
        scorecardNamesById,
        organizationNamesById,
        groupNamesById,
        assignedUserNamesById,
        methodStepCountsById,
    ] = await Promise.all([
        fetchPersonasById(adminSupabase, personaIds),
        fetchNamesById(adminSupabase, "coaches", coachIds),
        fetchMethodsById(adminSupabase, methodIds),
        fetchNamesById(adminSupabase, "scorecards", scorecardIds),
        fetchNamesById(adminSupabase, "organizations", organizationIds),
        fetchNamesById(adminSupabase, "groups", groupIds),
        fetchProfilesById(adminSupabase, assignedUserIds),
        fetchMethodStepCounts(adminSupabase, methodIds),
    ]);

    return rows.map((row) => {
        const persona = personasById.get(row.persona_id);
        const method = row.method_id ? methodsById.get(row.method_id) : null;

        return {
            ...row,
            assigned_user_name: row.assigned_user_id ? assignedUserNamesById.get(row.assigned_user_id) ?? null : null,
            coach_name: row.coach_id ? coachNamesById.get(row.coach_id) ?? null : null,
            group_name: row.group_id ? groupNamesById.get(row.group_id) ?? null : null,
            method_name: method?.name ?? method?.code ?? null,
            method_step_count: row.method_id ? methodStepCountsById.get(row.method_id) ?? 0 : 0,
            organization_name: row.organization_id ? organizationNamesById.get(row.organization_id) ?? null : null,
            persona_avatar_url: persona?.avatar_url ?? null,
            persona_company: persona?.company ?? null,
            persona_name: persona?.name ?? null,
            persona_role: persona?.role ?? null,
            scorecard_name: row.scorecard_id ? scorecardNamesById.get(row.scorecard_id) ?? null : null,
        };
    });
}

function extractScore(notationJson: unknown): number | null {
    if (!notationJson || typeof notationJson !== "object") {
        return null;
    }

    const record = notationJson as Record<string, unknown>;
    const scoreGlobal = record.score_global as Record<string, unknown> | undefined;
    const candidates = [
        record.note_globale,
        record.score,
        scoreGlobal?.valeur,
        scoreGlobal?.score,
        scoreGlobal?.score_process,
        record.score_global,
        record.global_score,
        record.note,
        (record.synthese as Record<string, unknown> | undefined)?.note_globale,
        (record.synthese as Record<string, unknown> | undefined)?.score,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
            return Math.max(0, Math.min(100, Math.round(candidate)));
        }
    }

    return null;
}

function normalizeScore(value: number | string | null | undefined) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.replace("%", "").trim());
        if (Number.isFinite(parsed)) {
            return Math.max(0, Math.min(100, Math.round(parsed)));
        }
    }

    return null;
}

async function fetchRoleplayStats(supabase: SupabaseClient, scenarioId: string, userId?: string | null): Promise<RoleplayStats> {
    let query = supabase
        .from("sessions")
        .select("id, created_at, duration_seconds, notation_json")
        .eq("scenario_id", scenarioId)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data, error } = await query.returns<SessionStatsRow[]>();

    if (error) throw error;

    const sessions = data ?? [];
    if (sessions.length === 0) {
        return createEmptyRoleplayStats();
    }

    const sessionIds = sessions.map((session) => session.id);
    const { data: normalizedResults, error: normalizedError } = await supabase
        .from("roleplay_session_results")
        .select("session_id, score_percent, completed_at")
        .in("session_id", sessionIds)
        .returns<RoleplaySessionResultStatsRow[]>();

    if (normalizedError) throw normalizedError;

    const scoresBySessionId = new Map(
        (normalizedResults ?? [])
            .map((result) => [result.session_id, normalizeScore(result.score_percent)] as const)
            .filter((entry): entry is readonly [string, number] => entry[1] !== null),
    );

    const scores = sessions
        .map((session) => scoresBySessionId.get(session.id) ?? extractScore(session.notation_json))
        .filter((score): score is number => score !== null);
    const latest = sessions[0];

    return {
        bestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lastDate: latest.created_at
            ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(latest.created_at))
            : "Aucune session",
        lastDuration: formatRoleplayDuration(latest.duration_seconds),
        scoreActuel: scores[0] ?? 0,
        simulations: sessions.length,
    };
}

export async function fetchRoleplayList(supabase: SupabaseClient): Promise<RoleplayListItem[]> {
    const { data, error } = await supabase
        .from("scenarios")
        .select(ROLEPLAY_SELECT)
        .neq("status", "archived")
        .order("updated_at", { ascending: false })
        .returns<RoleplayRow[]>();

    if (error) throw error;

    const rows = await withRoleplayRelations(data ?? []);
    const scenarioIds = rows.map((row) => row.id);
    const scenarioQuizRows = await fetchScenarioQuizzes(createAdminClient(), scenarioIds);
    const quizCountsByScenarioId = new Map<string, number>();

    for (const row of scenarioQuizRows) {
        quizCountsByScenarioId.set(row.scenario_id, (quizCountsByScenarioId.get(row.scenario_id) ?? 0) + 1);
    }

    return rows.map((row) => mapRoleplayRowToListItem(row, quizCountsByScenarioId.get(row.id) ?? 0));
}

export async function fetchRoleplaysByIds(supabase: SupabaseClient, roleplayIds: string[]): Promise<RoleplayListItem[]> {
    const uniqueRoleplayIds = uniqueValues(roleplayIds);
    if (uniqueRoleplayIds.length === 0) return [];

    const { data, error } = await supabase
        .from("scenarios")
        .select(ROLEPLAY_SELECT)
        .in("id", uniqueRoleplayIds)
        .returns<RoleplayRow[]>();

    if (error) throw error;

    const rows = await withRoleplayRelations(data ?? []);
    const scenarioQuizRows = await fetchScenarioQuizzes(createAdminClient(), uniqueRoleplayIds);
    const quizCountsByScenarioId = new Map<string, number>();

    for (const row of scenarioQuizRows) {
        quizCountsByScenarioId.set(row.scenario_id, (quizCountsByScenarioId.get(row.scenario_id) ?? 0) + 1);
    }

    return rows.map((row) => mapRoleplayRowToListItem(row, quizCountsByScenarioId.get(row.id) ?? 0));
}

export async function fetchRoleplayDetail(
    supabase: SupabaseClient,
    roleplayId: string,
    statsUserId?: string | null,
): Promise<RoleplayDetail> {
    const { data, error } = await supabase
        .from("scenarios")
        .select(ROLEPLAY_SELECT)
        .eq("id", roleplayId)
        .maybeSingle<RoleplayRow>();

    if (error) throw error;

    if (!data) {
        throw new NotFoundError("Roleplay introuvable.");
    }

    const adminSupabase = createAdminClient();
    const [row] = await withRoleplayRelations([data]);
    const scenarioQuizRows = await fetchScenarioQuizzes(adminSupabase, [roleplayId]);
    const methodQuizId = await fetchMethodKnowledgeQuizId(adminSupabase, row.method_id);
    const quizRows = await withQuizDetails(
        adminSupabase,
        mergeMethodKnowledgeQuizRow({
            methodQuizId,
            scenarioId: roleplayId,
            scenarioQuizRows,
        }),
    );
    const resourceRows = await fetchScenarioResources(adminSupabase, roleplayId);
    const stats = await fetchRoleplayStats(adminSupabase, roleplayId, statsUserId);

    return mapRoleplayRowsToDetail(row, quizRows, resourceRows, stats);
}
