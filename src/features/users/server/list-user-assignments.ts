import { requireAdmin } from "@/features/auth/server";
import { getQuizTypeLabel, type QuizType } from "@/features/evaluations/domain";
import {
    calculateRoleplayIndex,
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
} from "@/features/roleplays/domain";
import type {
    UserAssignedQuiz,
    UserAssignedRoleplay,
    UserAssignmentStatus,
} from "@/features/users/domain/users";
import { USER_CONTENT_ASSIGNMENT_SOURCE } from "@/features/users/domain/users";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    extractAssignmentScore,
    getUserVisibleAssignmentScopes,
    normalizeAssignmentScore,
    USER_VISIBLE_ASSIGNMENT_ACTIVE,
    USER_VISIBLE_ASSIGNMENT_STATUS,
    type UserTargetContext,
    type UserVisibleAssignmentScope,
} from "./user-assignment-visibility";
import {
    listExplicitQuizAssignments,
    listExplicitScenarioAssignments,
    listRoleplayDerivedQuizAssignments,
} from "./user-content-assignments.persistence";
import { listActiveUserAssignmentTargets } from "./user-assignment-targets";

interface ScenarioRow {
    created_at: string | null;
    id: string;
    persona_id: string | null;
    title: string;
}

interface AssignedScenarioRow extends ScenarioRow {
    assignmentAssignedAt: string | null;
    assignmentSource: UserAssignedRoleplay["assignmentSource"];
}

interface PersonaRow {
    id: string;
    name: string | null;
}

interface SessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    scenario_id: string | null;
    status: string | null;
}

interface RoleplaySessionResultRow {
    score_percent: number | string | null;
    session_id: string;
}

interface QuizRow {
    created_at: string | null;
    id: string;
    quiz_type: string | null;
    title: string;
}

interface AssignedQuizRow extends QuizRow {
    assignmentAssignedAt: string | null;
    assignmentSource: UserAssignedQuiz["assignmentSource"];
}

interface QuizAttemptRow {
    quiz_id: string | null;
    score_percent: number | null;
    status: string | null;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function uniqueRowsById<T extends { id: string }>(rows: T[]) {
    return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function formatLongDate(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function getStatus(statuses: string[]): UserAssignmentStatus {
    if (statuses.some((status) => status === "completed")) {
        return "completed";
    }

    if (statuses.length > 0) {
        return "in_progress";
    }

    return "not_started";
}

function getQuizType(value: string | null): QuizType {
    return value === "self_assessment" ? "self_assessment" : "knowledge";
}

export function calculateAssignedRoleplayIndex(
    sessions: Array<{ completedAt: string | null; score: number | null }>,
) {
    const scoresByRecency = sessions
        .filter((session): session is { completedAt: string | null; score: number } => session.score !== null)
        .sort((first, second) => (second.completedAt ?? "").localeCompare(first.completedAt ?? ""))
        .map((session) => session.score);

    return calculateRoleplayIndex(scoresByRecency).score;
}

async function getActiveUserTargetContext(userId: string): Promise<UserTargetContext> {
    const adminSupabase = createAdminClient();
    const targetsByUserId = await listActiveUserAssignmentTargets(adminSupabase, [userId]);

    return targetsByUserId.get(userId) ?? { groupIds: [], organizationIds: [] };
}

function buildScenarioVisibilityQuery(adminSupabase: ReturnType<typeof createAdminClient>, target: UserVisibleAssignmentScope) {
    const query = adminSupabase
        .from("scenarios")
        .select("id, title, persona_id, created_at")
        .eq("is_active", USER_VISIBLE_ASSIGNMENT_ACTIVE)
        .eq("status", USER_VISIBLE_ASSIGNMENT_STATUS)
        .eq("visibility_scope", target.scope);

    if (target.scope === "user") {
        return query.eq("assigned_user_id", target.assignedUserId).returns<ScenarioRow[]>();
    }

    if (target.scope === "group") {
        return query.in("group_id", target.groupIds).returns<ScenarioRow[]>();
    }

    if (target.scope === "organization") {
        return query.in("organization_id", target.organizationIds).returns<ScenarioRow[]>();
    }

    return query.returns<ScenarioRow[]>();
}

async function fetchAssignedScenarioRows(userId: string, context: UserTargetContext) {
    const adminSupabase = createAdminClient();
    const queries = getUserVisibleAssignmentScopes(userId, context).map((target) =>
        buildScenarioVisibilityQuery(adminSupabase, target),
    );

    const [results, explicitAssignments] = await Promise.all([
        Promise.all(queries),
        listExplicitScenarioAssignments(userId),
    ]);
    const rows: ScenarioRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    const explicitIds = explicitAssignments.map((assignment) => assignment.content_id);
    if (explicitIds.length > 0) {
        const { data, error } = await adminSupabase
            .from("scenarios")
            .select("id, title, persona_id, created_at")
            .in("id", explicitIds)
            .eq("is_active", USER_VISIBLE_ASSIGNMENT_ACTIVE)
            .eq("status", USER_VISIBLE_ASSIGNMENT_STATUS)
            .returns<ScenarioRow[]>();

        if (error) throw error;
        rows.push(...(data ?? []));
    }

    const explicitAssignmentById = new Map(
        explicitAssignments.map((assignment) => [assignment.content_id, assignment]),
    );

    return uniqueRowsById(rows)
        .map<AssignedScenarioRow>((row) => {
            const explicitAssignment = explicitAssignmentById.get(row.id);
            return {
                ...row,
                assignmentAssignedAt: explicitAssignment?.assigned_at ?? null,
                assignmentSource: explicitAssignment
                    ? USER_CONTENT_ASSIGNMENT_SOURCE.explicit
                    : USER_CONTENT_ASSIGNMENT_SOURCE.visibility,
            };
        })
        .sort((first, second) => {
            return (second.assignmentAssignedAt ?? second.created_at ?? "")
                .localeCompare(first.assignmentAssignedAt ?? first.created_at ?? "");
        });
}

function buildQuizVisibilityQuery(adminSupabase: ReturnType<typeof createAdminClient>, target: UserVisibleAssignmentScope) {
    const query = adminSupabase
        .from("quizzes")
        .select("id, title, quiz_type, created_at")
        .eq("is_active", USER_VISIBLE_ASSIGNMENT_ACTIVE)
        .eq("status", USER_VISIBLE_ASSIGNMENT_STATUS)
        .eq("visibility_scope", target.scope);

    if (target.scope === "user") {
        return query.eq("assigned_user_id", target.assignedUserId).returns<QuizRow[]>();
    }

    if (target.scope === "group") {
        return query.in("group_id", target.groupIds).returns<QuizRow[]>();
    }

    if (target.scope === "organization") {
        return query.in("organization_id", target.organizationIds).returns<QuizRow[]>();
    }

    return query.returns<QuizRow[]>();
}

async function fetchAssignedQuizRows(userId: string, context: UserTargetContext) {
    const adminSupabase = createAdminClient();
    const queries = getUserVisibleAssignmentScopes(userId, context).map((target) =>
        buildQuizVisibilityQuery(adminSupabase, target),
    );

    const [results, explicitAssignments, roleplayAssignments] = await Promise.all([
        Promise.all(queries),
        listExplicitQuizAssignments(userId),
        listRoleplayDerivedQuizAssignments(userId),
    ]);
    const rows: QuizRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    const additionalIds = uniqueValues([
        ...explicitAssignments.map((assignment) => assignment.content_id),
        ...roleplayAssignments.map((assignment) => assignment.content_id),
    ]);
    if (additionalIds.length > 0) {
        const { data, error } = await adminSupabase
            .from("quizzes")
            .select("id, title, quiz_type, created_at")
            .in("id", additionalIds)
            .eq("is_active", USER_VISIBLE_ASSIGNMENT_ACTIVE)
            .eq("status", USER_VISIBLE_ASSIGNMENT_STATUS)
            .returns<QuizRow[]>();

        if (error) throw error;
        rows.push(...(data ?? []));
    }

    const explicitAssignmentById = new Map(
        explicitAssignments.map((assignment) => [assignment.content_id, assignment]),
    );
    const roleplayAssignmentById = new Map(
        roleplayAssignments.map((assignment) => [assignment.content_id, assignment]),
    );

    return uniqueRowsById(rows)
        .map<AssignedQuizRow>((row) => {
            const explicitAssignment = explicitAssignmentById.get(row.id);
            const roleplayAssignment = roleplayAssignmentById.get(row.id);
            return {
                ...row,
                assignmentAssignedAt: explicitAssignment?.assigned_at ?? roleplayAssignment?.assigned_at ?? null,
                assignmentSource: explicitAssignment
                    ? USER_CONTENT_ASSIGNMENT_SOURCE.explicit
                    : roleplayAssignment
                        ? USER_CONTENT_ASSIGNMENT_SOURCE.roleplay
                        : USER_CONTENT_ASSIGNMENT_SOURCE.visibility,
            };
        })
        .sort((first, second) => {
            return (second.assignmentAssignedAt ?? second.created_at ?? "")
                .localeCompare(first.assignmentAssignedAt ?? first.created_at ?? "");
        });
}

export async function listUserAssignedRoleplays(userId: string): Promise<UserAssignedRoleplay[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getActiveUserTargetContext(userId);
    const rows = await fetchAssignedScenarioRows(userId, context);
    const scenarioIds = rows.map((scenario) => scenario.id);
    const personaIds = uniqueValues(rows.map((scenario) => scenario.persona_id));
    const [personasResult, sessionsResult] = await Promise.all([
        personaIds.length > 0
            ? adminSupabase.from("personas").select("id, name").in("id", personaIds).returns<PersonaRow[]>()
            : Promise.resolve({ data: [] as PersonaRow[], error: null }),
        scenarioIds.length > 0
            ? adminSupabase
                  .from("sessions")
                  .select("id, scenario_id, status, notation_json, created_at, duration_seconds")
                  .eq("user_id", userId)
                  .in("scenario_id", scenarioIds)
                  .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
                  .returns<SessionRow[]>()
            : Promise.resolve({ data: [] as SessionRow[], error: null }),
    ]);

    if (personasResult.error) {
        throw personasResult.error;
    }

    if (sessionsResult.error) {
        throw sessionsResult.error;
    }

    const personaNamesById = new Map((personasResult.data ?? []).map((persona) => [persona.id, persona.name ?? "Persona"]));
    const sessionsByScenarioId = new Map<string, SessionRow[]>();
    const sessionIds = (sessionsResult.data ?? []).map((session) => session.id);
    const normalizedResults =
        sessionIds.length > 0
            ? await adminSupabase
                  .from("roleplay_session_results")
                  .select("session_id, score_percent")
                  .in("session_id", sessionIds)
                  .returns<RoleplaySessionResultRow[]>()
            : { data: [] as RoleplaySessionResultRow[], error: null };

    if (normalizedResults.error) {
        throw normalizedResults.error;
    }

    const scoresBySessionId = new Map(
        (normalizedResults.data ?? [])
            .map((result) => [result.session_id, normalizeAssignmentScore(result.score_percent)] as const)
            .filter((entry): entry is readonly [string, number] => entry[1] !== null),
    );

    for (const session of sessionsResult.data ?? []) {
        if (!session.scenario_id) continue;
        sessionsByScenarioId.set(session.scenario_id, [
            ...(sessionsByScenarioId.get(session.scenario_id) ?? []),
            session,
        ]);
    }

    return rows.map((scenario) => {
        const sessions = sessionsByScenarioId.get(scenario.id) ?? [];
        const index = calculateAssignedRoleplayIndex(
            sessions.map((session) => ({
                completedAt: session.created_at,
                score: scoresBySessionId.get(session.id) ?? extractAssignmentScore(session.notation_json),
            })),
        );

        return {
            assignmentSource: scenario.assignmentSource,
            assignedAt: formatLongDate(scenario.assignmentAssignedAt ?? scenario.created_at),
            id: scenario.id,
            index,
            persona: scenario.persona_id ? personaNamesById.get(scenario.persona_id) ?? "Persona" : "Persona",
            sessions: sessions.length,
            status: getStatus(sessions.map((session) => session.status ?? "")),
            title: scenario.title,
        };
    });
}

export async function listUserAssignedQuizzes(userId: string): Promise<UserAssignedQuiz[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getActiveUserTargetContext(userId);
    const rows = await fetchAssignedQuizRows(userId, context);
    const quizIds = rows.map((quiz) => quiz.id);
    const attemptsResult =
        quizIds.length > 0
            ? await adminSupabase
                  .from("quiz_attempts")
                  .select("quiz_id, status, score_percent")
                  .eq("user_id", userId)
                  .in("quiz_id", quizIds)
                  .returns<QuizAttemptRow[]>()
            : { data: [] as QuizAttemptRow[], error: null };

    if (attemptsResult.error) {
        throw attemptsResult.error;
    }

    const attemptsByQuizId = new Map<string, QuizAttemptRow[]>();

    for (const attempt of attemptsResult.data ?? []) {
        if (!attempt.quiz_id) continue;
        attemptsByQuizId.set(attempt.quiz_id, [
            ...(attemptsByQuizId.get(attempt.quiz_id) ?? []),
            attempt,
        ]);
    }

    return rows.map((quiz) => {
        const attempts = attemptsByQuizId.get(quiz.id) ?? [];
        const scores = attempts
            .map((attempt) => attempt.score_percent)
            .filter((score): score is number => typeof score === "number" && Number.isFinite(score));

        return {
            assignmentSource: quiz.assignmentSource,
            assignedAt: formatLongDate(quiz.assignmentAssignedAt ?? quiz.created_at),
            attempts: attempts.length,
            id: quiz.id,
            score: scores.length > 0 ? Math.max(...scores) : null,
            status: getStatus(attempts.map((attempt) => attempt.status ?? "")),
            title: quiz.title,
            type: getQuizTypeLabel(getQuizType(quiz.quiz_type)),
        };
    });
}
