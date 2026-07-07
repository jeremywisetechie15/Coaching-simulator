import { requireAdmin } from "@/features/auth/server";
import type {
    UserAssignedQuiz,
    UserAssignedRoleplay,
    UserSkillStatistic,
    UserStatistics,
} from "@/features/users/domain/users";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractAssignmentScore, normalizeAssignmentScore } from "./user-assignment-visibility";
import { getWeightedProgressScore } from "./user-progress-score";

const DEFAULT_TARGET_SCORE = 80;

interface UserSessionStatsRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
}

interface RoleplayResultStatsRow {
    completed_at: string | null;
    score_percent: number | string | null;
    session_id: string;
}

interface QuizAttemptStatsRow {
    completed_at: string | null;
    score_percent: number | string | null;
    started_at: string | null;
    status: string | null;
    updated_at: string | null;
}

interface CriterionStatsRow {
    dimension_item_id: string | null;
    points_awarded: number | string | null;
    points_max: number | string | null;
    score_percent: number | string | null;
    skill_id: string | null;
}

interface NamedRow {
    id: string;
    label?: string | null;
    name?: string | null;
}

interface ScorePoint {
    completedAt: string | null;
    score: number;
    sessionId?: string;
}

interface SkillScoreInput {
    dimensionItemId: string | null;
    pointsAwarded: number | string | null;
    pointsMax: number | string | null;
    scorePercent: number | string | null;
    skillId: string | null;
}

interface BuildUserStatisticsInput {
    assignedQuizzes: UserAssignedQuiz[];
    assignedRoleplays: UserAssignedRoleplay[];
    criterionRows: SkillScoreInput[];
    dimensionItemLabelsById?: Map<string, string>;
    quizAttempts: QuizAttemptStatsRow[];
    roleplayScorePoints: ScorePoint[];
    skillNamesById?: Map<string, string>;
    sessions: UserSessionStatsRow[];
    targetScore?: number;
}

function roundScore(value: number) {
    return Math.round(value);
}

function average(values: number[]) {
    if (values.length === 0) return null;
    return roundScore(values.reduce((total, value) => total + value, 0) / values.length);
}

function formatPercent(value: number | null) {
    return value === null ? "N/A" : `${roundScore(value)}%`;
}

function formatDelta(value: number | null) {
    if (value === null) return "N/A";
    if (value > 0) return `+${roundScore(value)} pts`;
    if (value < 0) return `${roundScore(value)} pts`;
    return "0 pt";
}

function formatDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, totalSeconds);
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
    }

    return `${minutes}min`;
}

function daysBetween(date: Date, now: Date) {
    return Math.floor((now.getTime() - date.getTime()) / 86_400_000);
}

function formatLastActivity(value: string | null | undefined, now = new Date()) {
    if (!value) return "Aucune";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Aucune";

    const days = daysBetween(date, now);
    if (days <= 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 30) return `Il y a ${days}j`;

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

function dateValue(value: string | null | undefined) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}

function getLatestDate(values: Array<string | null | undefined>) {
    const latest = values
        .filter((value): value is string => Boolean(value))
        .sort((first, second) => dateValue(second) - dateValue(first))[0];

    return latest ?? null;
}

function completedCount<T extends { status: string }>(items: T[]) {
    return items.filter((item) => item.status === "completed").length;
}

function completionRate(completed: number, total: number) {
    return total > 0 ? roundScore((completed / total) * 100) : null;
}

function getRoleplayScores(sessions: UserSessionStatsRow[], normalizedScores: ScorePoint[]) {
    const normalizedBySessionId = new Map(normalizedScores.map((score) => [score.sessionId, score]));

    return sessions
        .flatMap((session) => {
            const normalized = normalizedBySessionId.get(session.id);
            const score = normalized?.score ?? extractAssignmentScore(session.notation_json);
            if (score === null) return [];

            return [
                {
                    completedAt: normalized?.completedAt ?? session.created_at,
                    score,
                },
            ];
        })
        .sort((first, second) => dateValue(first.completedAt) - dateValue(second.completedAt));
}

function getQuizScores(attempts: QuizAttemptStatsRow[]) {
    return attempts
        .filter((attempt) => attempt.status === "completed")
        .map((attempt) => normalizeAssignmentScore(attempt.score_percent))
        .filter((score): score is number => score !== null);
}

function scoreProgress(scores: ScorePoint[]) {
    if (scores.length < 2) return null;

    return scores[scores.length - 1].score - scores[0].score;
}

function scoreProgressLast30Days(scores: ScorePoint[], now = new Date()) {
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() - 30);
    const recentScores = scores.filter((score) => dateValue(score.completedAt) >= minDate.getTime());

    return scoreProgress(recentScores);
}

function skillKey(row: SkillScoreInput) {
    return row.skillId ?? row.dimensionItemId ?? "";
}

function skillLabel(row: SkillScoreInput, skillNamesById: Map<string, string>, dimensionItemLabelsById: Map<string, string>) {
    if (row.skillId) return skillNamesById.get(row.skillId) || "Compétence non renseignée";
    if (row.dimensionItemId) return dimensionItemLabelsById.get(row.dimensionItemId) || "Compétence non renseignée";
    return "Compétence non renseignée";
}

function buildSkillStatistics(
    rows: SkillScoreInput[],
    skillNamesById = new Map<string, string>(),
    dimensionItemLabelsById = new Map<string, string>(),
) {
    const groups = new Map<string, SkillScoreInput[]>();

    for (const row of rows) {
        const key = skillKey(row);
        if (!key) continue;
        groups.set(key, [...(groups.get(key) ?? []), row]);
    }

    return Array.from(groups.values()).map((items): UserSkillStatistic => {
        const sample = items[0];

        return {
            label: skillLabel(sample, skillNamesById, dimensionItemLabelsById),
            score: getWeightedProgressScore(items) ?? 0,
        };
    });
}

function emptyStatistics(): UserStatistics {
    return {
        averageQuizScore: "N/A",
        averageRoleplayScore: "N/A",
        bestRoleplayScore: "N/A",
        completedQuizzes: "0/0",
        completedRoleplays: "0/0",
        completionRate: "N/A",
        lastActivity: "Aucune",
        latestRoleplayScore: "N/A",
        quizVsRoleplayGap: "N/A",
        roleplayProgressLast30Days: "N/A",
        roleplayProgressSinceFirst: "N/A",
        targetScore: `${DEFAULT_TARGET_SCORE}%`,
        targetScoreGap: "N/A",
        topMasteredSkills: [],
        topSkillsToImprove: [],
        trainingTime: "0min",
    };
}

export function buildUserStatistics(input: BuildUserStatisticsInput): UserStatistics {
    const fallback = emptyStatistics();
    const targetScore = input.targetScore ?? DEFAULT_TARGET_SCORE;
    const roleplayScores = getRoleplayScores(input.sessions, input.roleplayScorePoints);
    const roleplayScoreValues = roleplayScores.map((score) => score.score);
    const quizScores = getQuizScores(input.quizAttempts);
    const averageRoleplayScore = average(roleplayScoreValues);
    const averageQuizScore = average(quizScores);
    const bestRoleplayScore = roleplayScoreValues.length > 0 ? Math.max(...roleplayScoreValues) : null;
    const latestRoleplayScore = roleplayScores.at(-1)?.score ?? null;
    const completedRoleplays = completedCount(input.assignedRoleplays);
    const completedQuizzes = completedCount(input.assignedQuizzes);
    const totalAssignments = input.assignedRoleplays.length + input.assignedQuizzes.length;
    const completedAssignments = completedRoleplays + completedQuizzes;
    const latestActivity = getLatestDate([
        ...input.sessions.map((session) => session.created_at),
        ...input.quizAttempts.map((attempt) => attempt.completed_at ?? attempt.updated_at ?? attempt.started_at),
    ]);
    const skillStats = buildSkillStatistics(
        input.criterionRows,
        input.skillNamesById,
        input.dimensionItemLabelsById,
    );

    return {
        ...fallback,
        averageQuizScore: formatPercent(averageQuizScore),
        averageRoleplayScore: formatPercent(averageRoleplayScore),
        bestRoleplayScore: formatPercent(bestRoleplayScore),
        completedQuizzes: `${completedQuizzes}/${input.assignedQuizzes.length}`,
        completedRoleplays: `${completedRoleplays}/${input.assignedRoleplays.length}`,
        completionRate: formatPercent(completionRate(completedAssignments, totalAssignments)),
        lastActivity: formatLastActivity(latestActivity),
        latestRoleplayScore: formatPercent(latestRoleplayScore),
        quizVsRoleplayGap:
            averageQuizScore !== null && averageRoleplayScore !== null
                ? formatDelta(averageQuizScore - averageRoleplayScore)
                : "N/A",
        roleplayProgressLast30Days: formatDelta(scoreProgressLast30Days(roleplayScores)),
        roleplayProgressSinceFirst: formatDelta(scoreProgress(roleplayScores)),
        targetScore: `${targetScore}%`,
        targetScoreGap: latestRoleplayScore !== null ? `Écart : ${formatDelta(latestRoleplayScore - targetScore)}` : "N/A",
        topMasteredSkills: skillStats
            .slice()
            .sort((first, second) => second.score - first.score)
            .slice(0, 3),
        topSkillsToImprove: skillStats
            .slice()
            .sort((first, second) => first.score - second.score)
            .slice(0, 3),
        trainingTime: formatDuration(
            input.sessions.reduce((total, session) => total + Math.max(0, session.duration_seconds ?? 0), 0),
        ),
    };
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
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

export async function listUserStatistics(
    userId: string,
    assignments: {
        assignedQuizzes: UserAssignedQuiz[];
        assignedRoleplays: UserAssignedRoleplay[];
    },
): Promise<UserStatistics> {
    await requireAdmin();

    const supabase = createAdminClient();
    const [sessionsResult, roleplayResultsResult, quizAttemptsResult, criteriaResult] = await Promise.all([
        supabase
            .from("sessions")
            .select("id, created_at, duration_seconds, notation_json")
            .eq("user_id", userId)
            .eq("status", "completed")
            .returns<UserSessionStatsRow[]>(),
        supabase
            .from("roleplay_session_results")
            .select("session_id, score_percent, completed_at")
            .eq("user_id", userId)
            .returns<RoleplayResultStatsRow[]>(),
        supabase
            .from("quiz_attempts")
            .select("status, score_percent, started_at, completed_at, updated_at")
            .eq("user_id", userId)
            .returns<QuizAttemptStatsRow[]>(),
        supabase
            .from("roleplay_session_criterion_results")
            .select("skill_id, dimension_item_id, score_percent, points_awarded, points_max")
            .eq("user_id", userId)
            .returns<CriterionStatsRow[]>(),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (roleplayResultsResult.error) throw roleplayResultsResult.error;
    if (quizAttemptsResult.error) throw quizAttemptsResult.error;
    if (criteriaResult.error) throw criteriaResult.error;

    const criterionRows = criteriaResult.data ?? [];
    const [skillNamesById, dimensionItemLabelsById] = await Promise.all([
        fetchNames("skills", uniqueValues(criterionRows.map((row) => row.skill_id)), "name"),
        fetchNames("skill_dimension_items", uniqueValues(criterionRows.map((row) => row.dimension_item_id)), "label"),
    ]);

    return buildUserStatistics({
        ...assignments,
        criterionRows: criterionRows.map((row) => ({
            dimensionItemId: row.dimension_item_id,
            pointsAwarded: row.points_awarded,
            pointsMax: row.points_max,
            scorePercent: row.score_percent,
            skillId: row.skill_id,
        })),
        dimensionItemLabelsById,
        quizAttempts: quizAttemptsResult.data ?? [],
        roleplayScorePoints: (roleplayResultsResult.data ?? []).flatMap((row) => {
            const score = normalizeAssignmentScore(row.score_percent);
            if (score === null) return [];

            return [{ completedAt: row.completed_at, score, sessionId: row.session_id }];
        }),
        sessions: sessionsResult.data ?? [],
        skillNamesById,
    });
}
