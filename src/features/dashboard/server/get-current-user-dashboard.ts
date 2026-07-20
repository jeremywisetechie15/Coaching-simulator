import { requirePlatformUser } from "@/features/auth/server";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";
import {
    buildDashboardViewData,
    type DashboardPeriodDays,
    type DashboardQuizAttemptRecord,
    type DashboardQuizRecord,
    type DashboardRoleplaySessionRecord,
    type DashboardScenarioRecord,
    type DashboardViewData,
} from "@/features/dashboard/domain";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import { fetchQuizQuestionCounts } from "@/features/evaluations/server";
import {
    listExplicitQuizAssignments,
    listExplicitScenarioAssignments,
    listRoleplayDerivedQuizAssignments,
} from "@/features/users/server/user-content-assignments.persistence";
import {
    extractAssignmentScore,
    normalizeAssignmentScore,
} from "@/features/users/server/user-assignment-visibility";
import { createClient } from "@/lib/supabase/server";

interface ScenarioRow {
    category: string | null;
    domain: string | null;
    id: string;
    persona_id: string | null;
    title: string;
}

interface QuizRow {
    category: string | null;
    domain: string | null;
    duration_minutes: number | null;
    id: string;
    max_attempts: number | null;
    title: string;
    validation_threshold: number | null;
}

interface SessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    scenario_id: string | null;
}

interface RoleplayResultRow {
    score_percent: number | string | null;
    session_id: string;
}

interface QuizAttemptRow {
    attempt_number: number;
    completed_at: string | null;
    id: string;
    quiz_id: string;
    score_percent: number | null;
    started_at: string;
    status: string;
}

interface PersonaRow {
    avatar_url: string | null;
    id: string;
    name: string;
}

function assignmentDateMap(rows: Array<{ assigned_at: string; content_id: string }>) {
    return new Map(rows.map((row) => [row.content_id, row.assigned_at]));
}

function mergeAssignmentDates(
    ...maps: Array<Map<string, string>>
) {
    const result = new Map<string, string>();

    for (const map of maps) {
        for (const [contentId, assignedAt] of map) {
            const current = result.get(contentId);
            if (!current || assignedAt > current) result.set(contentId, assignedAt);
        }
    }

    return result;
}

export async function getCurrentUserDashboard(
    periodDays: DashboardPeriodDays,
): Promise<DashboardViewData> {
    const context = await requirePlatformUser();
    const supabase = await createClient();
    const [
        authResult,
        scenariosResult,
        quizzesResult,
        sessionsResult,
        roleplayResultsResult,
        quizAttemptsResult,
        explicitScenarioAssignments,
        explicitQuizAssignments,
        roleplayDerivedQuizAssignments,
    ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
            .from("scenarios")
            .select("id, title, persona_id, domain, category")
            .eq("status", "published")
            .eq("is_active", true)
            .order("title", { ascending: true })
            .returns<ScenarioRow[]>(),
        supabase
            .from("quizzes")
            .select("id, title, domain, category, duration_minutes, validation_threshold, max_attempts")
            .eq("status", "published")
            .eq("is_active", true)
            .order("title", { ascending: true })
            .returns<QuizRow[]>(),
        supabase
            .from("sessions")
            .select("id, scenario_id, created_at, duration_seconds, notation_json")
            .eq("user_id", context.userId)
            .eq("status", "completed")
            .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
            .order("created_at", { ascending: false })
            .returns<SessionRow[]>(),
        supabase
            .from("roleplay_session_results")
            .select("session_id, score_percent")
            .eq("user_id", context.userId)
            .returns<RoleplayResultRow[]>(),
        supabase
            .from("quiz_attempts")
            .select("id, quiz_id, status, attempt_number, started_at, completed_at, score_percent")
            .eq("user_id", context.userId)
            .order("started_at", { ascending: false })
            .returns<QuizAttemptRow[]>(),
        listExplicitScenarioAssignments(context.userId),
        listExplicitQuizAssignments(context.userId),
        listRoleplayDerivedQuizAssignments(context.userId),
    ]);

    if (authResult.error) throw authResult.error;
    if (scenariosResult.error) throw scenariosResult.error;
    if (quizzesResult.error) throw quizzesResult.error;
    if (sessionsResult.error) throw sessionsResult.error;
    if (roleplayResultsResult.error) throw roleplayResultsResult.error;
    if (quizAttemptsResult.error) throw quizAttemptsResult.error;

    const scenarios = scenariosResult.data ?? [];
    const quizzes = quizzesResult.data ?? [];
    const personaIds = Array.from(new Set(
        scenarios.map((scenario) => scenario.persona_id).filter((id): id is string => Boolean(id)),
    ));
    const [personasResult, questionCountByQuizId] = await Promise.all([
        personaIds.length > 0
            ? supabase
                  .from("personas")
                  .select("id, name, avatar_url")
                  .in("id", personaIds)
                  .returns<PersonaRow[]>()
            : Promise.resolve({ data: [] as PersonaRow[], error: null }),
        fetchQuizQuestionCounts(supabase, quizzes.map((quiz) => quiz.id)),
    ]);

    if (personasResult.error) throw personasResult.error;

    const userCreatedAt = authResult.data.user?.created_at ?? null;
    const personaById = new Map((personasResult.data ?? []).map((persona) => [persona.id, persona]));
    const explicitScenarioAssignmentDates = assignmentDateMap(explicitScenarioAssignments);
    const quizAssignmentDates = mergeAssignmentDates(
        assignmentDateMap(explicitQuizAssignments),
        assignmentDateMap(roleplayDerivedQuizAssignments),
    );
    const scoresBySessionId = new Map(
        (roleplayResultsResult.data ?? []).flatMap((result) => {
            const score = normalizeAssignmentScore(result.score_percent);
            return score === null ? [] : [[result.session_id, score] as const];
        }),
    );
    const dashboardScenarios: DashboardScenarioRecord[] = scenarios.map((scenario) => {
        const persona = scenario.persona_id ? personaById.get(scenario.persona_id) : null;

        return {
            assignedAt: explicitScenarioAssignmentDates.get(scenario.id) ?? userCreatedAt,
            category: scenario.category,
            domain: scenario.domain,
            id: scenario.id,
            personaAvatarUrl: getPersonaAvatarPublicUrl(persona?.avatar_url),
            personaName: persona?.name ?? null,
            title: scenario.title,
        };
    });
    const dashboardQuizzes: DashboardQuizRecord[] = quizzes.map((quiz) => ({
        assignedAt: quizAssignmentDates.get(quiz.id) ?? userCreatedAt,
        category: quiz.category,
        domain: quiz.domain,
        durationMinutes: quiz.duration_minutes,
        id: quiz.id,
        maxAttempts: quiz.max_attempts,
        questionCount: questionCountByQuizId.get(quiz.id) ?? 0,
        title: quiz.title,
        validationThreshold: quiz.validation_threshold,
    }));
    const dashboardSessions: DashboardRoleplaySessionRecord[] = (sessionsResult.data ?? []).flatMap((session) => {
        if (!session.scenario_id || !session.created_at || session.duration_seconds === null) return [];

        return [{
            createdAt: session.created_at,
            durationSeconds: session.duration_seconds,
            id: session.id,
            scenarioId: session.scenario_id,
            scorePercent: scoresBySessionId.get(session.id) ?? extractAssignmentScore(session.notation_json),
        }];
    });
    const dashboardQuizAttempts: DashboardQuizAttemptRecord[] = (quizAttemptsResult.data ?? []).flatMap((attempt) => {
        if (attempt.status !== "completed" && attempt.status !== "in_progress") return [];

        return [{
            attemptNumber: attempt.attempt_number,
            completedAt: attempt.completed_at,
            id: attempt.id,
            quizId: attempt.quiz_id,
            scorePercent: attempt.score_percent,
            startedAt: attempt.started_at,
            status: attempt.status,
        }];
    });

    return buildDashboardViewData({
        periodDays,
        quizAttempts: dashboardQuizAttempts,
        quizzes: dashboardQuizzes,
        roleplaySessions: dashboardSessions,
        scenarios: dashboardScenarios,
    });
}
