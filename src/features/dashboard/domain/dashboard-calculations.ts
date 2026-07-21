import { CONTENT_DOMAINS } from "@/features/content/domain";
import {
    getQuizAttemptsRemaining,
    QUIZ_DEFAULT_VALIDATION_THRESHOLD,
} from "@/features/evaluations/domain";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain/evaluation-routes";
import {
    ROLEPLAY_MASTERY_THRESHOLD_PERCENT,
    ROLEPLAY_ROUTES,
} from "@/features/roleplays/domain";
import { APP_TIME_ZONE, formatLongDate } from "@/lib/date/format-date-time";
import {
    roundDashboardScore,
    type DashboardActivityCollection,
    type DashboardActivityItem,
    type DashboardChartSeries,
    type DashboardDomainGroup,
    type DashboardMetric,
    type DashboardPerformanceSnapshot,
    type DashboardPeriodDays,
    type DashboardViewData,
} from "./dashboard";

const DASHBOARD_LIST_LIMIT = 3;

export interface DashboardScenarioRecord {
    assignedAt: string | null;
    category: string | null;
    domain: string | null;
    id: string;
    personaAvatarUrl: string | null;
    personaName: string | null;
    title: string;
}

export interface DashboardQuizRecord {
    assignedAt: string | null;
    categories: string[];
    domain: string | null;
    durationMinutes: number | null;
    id: string;
    maxAttempts: number | null;
    questionCount: number;
    title: string;
    validationThreshold: number | null;
}

export interface DashboardRoleplaySessionRecord {
    createdAt: string;
    durationSeconds: number;
    id: string;
    scenarioId: string;
    scorePercent: number | null;
}

export interface DashboardQuizAttemptRecord {
    attemptNumber: number;
    completedAt: string | null;
    id: string;
    quizId: string;
    scorePercent: number | null;
    startedAt: string;
    status: "completed" | "in_progress";
}

export interface BuildDashboardInput {
    now?: Date;
    periodDays: DashboardPeriodDays;
    quizAttempts: DashboardQuizAttemptRecord[];
    quizzes: DashboardQuizRecord[];
    roleplaySessions: DashboardRoleplaySessionRecord[];
    scenarios: DashboardScenarioRecord[];
}

export interface DashboardPeriodRange {
    currentEndExclusive: Date;
    currentStart: Date;
    previousStart: Date;
}

interface ScorePoint {
    activityId: string;
    occurredAt: string;
    score: number;
}

interface CalendarDateParts {
    day: number;
    month: number;
    year: number;
}

const calendarPartsFormatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
});

function calendarDateParts(value: Date): CalendarDateParts {
    const parts = Object.fromEntries(
        calendarPartsFormatter
            .formatToParts(value)
            .filter(({ type }) => type !== "literal")
            .map(({ type, value: partValue }) => [type, Number(partValue)]),
    );

    return { day: parts.day, month: parts.month, year: parts.year };
}

function timeZoneOffsetMilliseconds(value: Date) {
    const parts = Object.fromEntries(
        calendarPartsFormatter
            .formatToParts(value)
            .filter(({ type }) => type !== "literal")
            .map(({ type, value: partValue }) => [type, Number(partValue)]),
    );
    const representedAsUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour === 24 ? 0 : parts.hour,
        parts.minute,
        parts.second,
    );

    return representedAsUtc - Math.floor(value.getTime() / 1000) * 1000;
}

function appTimeZoneMidnight(parts: CalendarDateParts) {
    const wallClockUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
    let instant = new Date(wallClockUtc - timeZoneOffsetMilliseconds(new Date(wallClockUtc)));
    instant = new Date(wallClockUtc - timeZoneOffsetMilliseconds(instant));
    return instant;
}

function shiftCalendarDays(parts: CalendarDateParts, days: number) {
    const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
    return appTimeZoneMidnight({
        day: shifted.getUTCDate(),
        month: shifted.getUTCMonth() + 1,
        year: shifted.getUTCFullYear(),
    });
}

function toTimestamp(value: string | null | undefined) {
    if (!value) return 0;
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function normalizeScore(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, value));
}

function average(values: number[]) {
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function inRange(value: string, start: Date, endExclusive: Date) {
    const timestamp = toTimestamp(value);
    return timestamp >= start.getTime() && timestamp < endExclusive.getTime();
}

export function getDashboardPeriodRange(
    periodDays: DashboardPeriodDays,
    now = new Date(),
): DashboardPeriodRange {
    const today = calendarDateParts(now);
    const currentStart = shiftCalendarDays(today, -(periodDays - 1));
    const currentEndExclusive = shiftCalendarDays(today, 1);
    const previousStart = shiftCalendarDays(calendarDateParts(currentStart), -periodDays);

    return { currentEndExclusive, currentStart, previousStart };
}

export function getBestDashboardScoresByActivity(points: ScorePoint[]) {
    const bestByActivity = new Map<string, number>();

    for (const point of points) {
        const score = normalizeScore(point.score);
        if (score === null) continue;
        const currentBest = bestByActivity.get(point.activityId);
        if (currentBest === undefined || score > currentBest) {
            bestByActivity.set(point.activityId, score);
        }
    }

    return bestByActivity;
}

export function calculateDashboardAverageScore(points: ScorePoint[]) {
    const scores = [...getBestDashboardScoresByActivity(points).values()];
    const score = average(scores);

    return {
        sampleSize: scores.length,
        score,
    };
}

function formatDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours === 0) return `${minutes} min`;
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
}

function formatDurationDelta(deltaSeconds: number, periodDays: DashboardPeriodDays) {
    if (deltaSeconds === 0) return `Stable vs ${periodDays} derniers jours`;
    const prefix = deltaSeconds > 0 ? "+" : "-";
    return `${prefix}${formatDuration(Math.abs(deltaSeconds))} vs ${periodDays} derniers jours`;
}

function formatCountDelta(delta: number, periodDays: DashboardPeriodDays) {
    if (delta === 0) return `Stable vs ${periodDays} derniers jours`;
    return `${delta > 0 ? "+" : ""}${delta} vs ${periodDays} derniers jours`;
}

function calculatePointsDelta(currentScore: number | null, previousScore: number | null) {
    if (currentScore === null || previousScore === null) return null;
    return currentScore - previousScore;
}

function sortByDateDescending<T>(items: T[], getDate: (item: T) => string | null | undefined) {
    return items.slice().sort((first, second) => toTimestamp(getDate(second)) - toTimestamp(getDate(first)));
}

function dashboardCategory(category: string | null, domain: string | null, fallback: string) {
    return category?.trim() || domain?.trim() || fallback;
}

function dashboardQuizCategory(categories: string[], domain: string | null) {
    return categories.length > 0 ? categories.join(", ") : dashboardCategory(null, domain, "Non affecté");
}

function buildScorePointsFromRoleplays(sessions: DashboardRoleplaySessionRecord[]): ScorePoint[] {
    return sessions.flatMap((session) => {
        const score = normalizeScore(session.scorePercent);
        return score === null
            ? []
            : [{ activityId: session.scenarioId, occurredAt: session.createdAt, score }];
    });
}

function buildScorePointsFromQuizzes(attempts: DashboardQuizAttemptRecord[]): ScorePoint[] {
    return attempts.flatMap((attempt) => {
        const score = normalizeScore(attempt.scorePercent);
        return attempt.status !== "completed" || !attempt.completedAt || score === null
            ? []
            : [{ activityId: attempt.quizId, occurredAt: attempt.completedAt, score }];
    });
}

export function getDashboardChartBuckets(
    periodDays: DashboardPeriodDays,
    range: DashboardPeriodRange,
) {
    const bucketDays = periodDays === 90 ? 7 : 1;
    const bucketCount = Math.ceil(periodDays / bucketDays);
    const formatter = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: APP_TIME_ZONE,
    });

    return Array.from({ length: bucketCount }, (_, index) => {
        const start = shiftCalendarDays(calendarDateParts(range.currentStart), index * bucketDays);
        const nextStart = shiftCalendarDays(calendarDateParts(start), bucketDays);
        const shouldShow =
            periodDays === 7
            || (periodDays === 30 && (index % 7 === 0 || index === bucketCount - 1))
            || (periodDays === 90 && (index % 3 === 0 || index === bucketCount - 1));
        return {
            endExclusive: nextStart < range.currentEndExclusive ? nextStart : range.currentEndExclusive,
            label: shouldShow ? formatter.format(start) : "",
            start,
        };
    });
}

function buildChartSeriesValues(
    points: ScorePoint[],
    periodDays: DashboardPeriodDays,
    range: DashboardPeriodRange,
) {
    const buckets = getDashboardChartBuckets(periodDays, range);
    const pointsByBucket = new Map<number, ScorePoint[]>();

    for (const point of points) {
        if (!inRange(point.occurredAt, range.currentStart, range.currentEndExclusive)) continue;
        const bucketIndex = buckets.findIndex((bucket) =>
            inRange(point.occurredAt, bucket.start, bucket.endExclusive),
        );
        if (bucketIndex < 0) continue;
        pointsByBucket.set(bucketIndex, [...(pointsByBucket.get(bucketIndex) ?? []), point]);
    }

    return buckets.map((_, index) => {
        return average((pointsByBucket.get(index) ?? []).map((point) => point.score));
    });
}

function buildPerformance(
    roleplayPoints: ScorePoint[],
    quizPoints: ScorePoint[],
    periodDays: DashboardPeriodDays,
    range: DashboardPeriodRange,
): DashboardPerformanceSnapshot {
    const currentRoleplayPoints = roleplayPoints.filter((point) =>
        inRange(point.occurredAt, range.currentStart, range.currentEndExclusive),
    );
    const previousRoleplayPoints = roleplayPoints.filter((point) =>
        inRange(point.occurredAt, range.previousStart, range.currentStart),
    );
    const currentQuizPoints = quizPoints.filter((point) =>
        inRange(point.occurredAt, range.currentStart, range.currentEndExclusive),
    );
    const previousQuizPoints = quizPoints.filter((point) =>
        inRange(point.occurredAt, range.previousStart, range.currentStart),
    );
    const currentRoleplay = calculateDashboardAverageScore(currentRoleplayPoints);
    const previousRoleplay = calculateDashboardAverageScore(previousRoleplayPoints);
    const currentQuiz = calculateDashboardAverageScore(currentQuizPoints);
    const previousQuiz = calculateDashboardAverageScore(previousQuizPoints);
    const series: DashboardChartSeries[] = [
        {
            label: "Roleplay",
            tone: "roleplay",
            values: buildChartSeriesValues(roleplayPoints, periodDays, range),
        },
        {
            label: "Quiz",
            tone: "quiz",
            values: buildChartSeriesValues(quizPoints, periodDays, range),
        },
    ];

    return {
        chartLabels: getDashboardChartBuckets(periodDays, range).map((bucket) => bucket.label),
        scoreSummaries: [
            {
                label: "Score moyen roleplay",
                sampleSize: currentRoleplay.sampleSize,
                tone: "roleplay",
                trend: calculatePointsDelta(currentRoleplay.score, previousRoleplay.score),
                value: currentRoleplay.score,
            },
            {
                label: "Score moyen quiz",
                sampleSize: currentQuiz.sampleSize,
                tone: "quiz",
                trend: calculatePointsDelta(currentQuiz.score, previousQuiz.score),
                value: currentQuiz.score,
            },
        ],
        series,
    };
}

function buildDomainGroups(
    content: Array<{ domain: string | null; id: string; title: string }>,
    bestScoresByActivity: Map<string, number>,
    kind: "quiz" | "roleplay",
): DashboardDomainGroup[] {
    return CONTENT_DOMAINS.filter((domain) => content.some((item) => item.domain === domain)).map((domain) => {
        const domainContent = content.filter((item) => item.domain === domain);
        const items = domainContent.flatMap((item) => {
            const score = bestScoresByActivity.get(item.id);
            return score === undefined ? [] : [{ label: item.title, score }];
        });
        const domainAverage = average(items.map((item) => item.score));

        return {
            id: `${kind}-${domain.toLocaleLowerCase("fr-FR").replace(/\s+/g, "-")}`,
            items,
            label: domain,
            score: domainAverage,
        };
    });
}

function buildRoleplayCollection(
    scenarios: DashboardScenarioRecord[],
    sessions: DashboardRoleplaySessionRecord[],
    range: DashboardPeriodRange,
): DashboardActivityCollection {
    const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
    const currentSessions = sortByDateDescending(
        sessions.filter((session) => inRange(session.createdAt, range.currentStart, range.currentEndExclusive)),
        (session) => session.createdAt,
    );
    const bestScores = getBestDashboardScoresByActivity(buildScorePointsFromRoleplays(sessions));
    const startedScenarioIds = new Set(sessions.map((session) => session.scenarioId));
    const completedItems = currentSessions.flatMap<DashboardActivityItem>((session) => {
        const scenario = scenarioById.get(session.scenarioId);
        const score = normalizeScore(session.scorePercent);
        if (!scenario || score === null) return [];

        return [{
            actionLabel: "Rejouer",
            category: dashboardCategory(scenario.category, scenario.domain, "Roleplay"),
            date: formatLongDate(session.createdAt, "Date indisponible"),
            duration: formatDuration(session.durationSeconds),
            href: ROLEPLAY_ROUTES.app.detail(scenario.id),
            id: session.id,
            imageSrc: scenario.personaAvatarUrl ?? undefined,
            kind: "roleplay",
            name: scenario.personaName ?? "Persona IA",
            score: roundDashboardScore(score),
            status: "completed",
            statusLabel: score >= ROLEPLAY_MASTERY_THRESHOLD_PERCENT ? "Validé" : "À retravailler",
            title: scenario.title,
        }];
    });
    const todoScenarios = sortByDateDescending(
        scenarios.filter((scenario) => !startedScenarioIds.has(scenario.id)),
        (scenario) => scenario.assignedAt,
    );
    const todoItems = todoScenarios.map<DashboardActivityItem>((scenario) => ({
        actionLabel: "Commencer",
        category: dashboardCategory(scenario.category, scenario.domain, "Roleplay"),
        date: formatLongDate(scenario.assignedAt, "Assignation récente"),
        href: ROLEPLAY_ROUTES.app.detail(scenario.id),
        id: scenario.id,
        imageSrc: scenario.personaAvatarUrl ?? undefined,
        kind: "roleplay",
        name: scenario.personaName ?? "Persona IA",
        status: "todo",
        statusLabel: "Assigné",
        title: scenario.title,
    }));
    const retryScenarios = scenarios
        .flatMap((scenario) => {
            const score = bestScores.get(scenario.id);
            return score !== undefined && score < ROLEPLAY_MASTERY_THRESHOLD_PERCENT
                ? [{ scenario, score }]
                : [];
        })
        .sort((first, second) => first.score - second.score);
    const retryItems = retryScenarios.map<DashboardActivityItem>(({ scenario, score }) => ({
        actionLabel: "Rejouer",
        category: dashboardCategory(scenario.category, scenario.domain, "Roleplay"),
        date: `Score cible : ${ROLEPLAY_MASTERY_THRESHOLD_PERCENT}%`,
        href: ROLEPLAY_ROUTES.app.detail(scenario.id),
        id: scenario.id,
        imageSrc: scenario.personaAvatarUrl ?? undefined,
        kind: "roleplay",
        name: scenario.personaName ?? "Persona IA",
        score: roundDashboardScore(score),
        status: "retry",
        statusLabel: "À retravailler",
        title: scenario.title,
    }));

    return {
        counts: {
            completed: currentSessions.length,
            retry: retryItems.length,
            todo: todoItems.length,
        },
        items: {
            completed: completedItems.slice(0, DASHBOARD_LIST_LIMIT),
            retry: retryItems.slice(0, DASHBOARD_LIST_LIMIT),
            todo: todoItems.slice(0, DASHBOARD_LIST_LIMIT),
        },
    };
}

function buildQuizCollection(
    quizzes: DashboardQuizRecord[],
    attempts: DashboardQuizAttemptRecord[],
    range: DashboardPeriodRange,
): DashboardActivityCollection {
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const completedAttempts = attempts.filter((attempt) => attempt.status === "completed" && attempt.completedAt);
    const completedAttemptCountByQuizId = new Map<string, number>();
    for (const attempt of completedAttempts) {
        completedAttemptCountByQuizId.set(
            attempt.quizId,
            (completedAttemptCountByQuizId.get(attempt.quizId) ?? 0) + 1,
        );
    }
    const bestScores = getBestDashboardScoresByActivity(buildScorePointsFromQuizzes(completedAttempts));
    const completedQuizIds = new Set(completedAttempts.map((attempt) => attempt.quizId));
    const latestCurrentAttemptByQuizId = new Map<string, DashboardQuizAttemptRecord>();
    const currentAttempts = sortByDateDescending(
        completedAttempts.filter((attempt) =>
            Boolean(attempt.completedAt && inRange(attempt.completedAt, range.currentStart, range.currentEndExclusive)),
        ),
        (attempt) => attempt.completedAt,
    );

    for (const attempt of currentAttempts) {
        if (!latestCurrentAttemptByQuizId.has(attempt.quizId)) {
            latestCurrentAttemptByQuizId.set(attempt.quizId, attempt);
        }
    }

    const completedItems = [...latestCurrentAttemptByQuizId.values()].flatMap<DashboardActivityItem>((attempt) => {
        const quiz = quizById.get(attempt.quizId);
        const score = bestScores.get(attempt.quizId);
        if (!quiz || score === undefined) return [];
        const threshold = quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD;
        const attemptsRemaining = getQuizAttemptsRemaining(
            quiz.maxAttempts,
            completedAttemptCountByQuizId.get(quiz.id) ?? 0,
        );

        return [{
            actionLabel: "Voir le résultat",
            attemptsRemaining,
            category: dashboardQuizCategory(quiz.categories, quiz.domain),
            date: formatLongDate(attempt.completedAt, "Date indisponible"),
            href: EVALUATION_ROUTES.app.results(quiz.id),
            id: quiz.id,
            kind: "quiz",
            questionCount: quiz.questionCount,
            score: roundDashboardScore(score),
            status: "completed",
            statusLabel: score >= threshold ? "Validé" : "À retravailler",
            title: quiz.title,
        }];
    });
    const todoQuizzes = sortByDateDescending(
        quizzes.filter((quiz) => !completedQuizIds.has(quiz.id)),
        (quiz) => quiz.assignedAt,
    );
    const todoItems = todoQuizzes.map<DashboardActivityItem>((quiz) => {
        const inProgressAttempt = attempts.find(
            (attempt) => attempt.quizId === quiz.id && attempt.status === "in_progress",
        );

        return {
            actionLabel: inProgressAttempt ? "Reprendre" : "Commencer",
            attemptsRemaining: getQuizAttemptsRemaining(
                quiz.maxAttempts,
                completedAttemptCountByQuizId.get(quiz.id) ?? 0,
            ),
            category: dashboardQuizCategory(quiz.categories, quiz.domain),
            date: formatLongDate(quiz.assignedAt, "Assignation récente"),
            href: EVALUATION_ROUTES.app.quiz(quiz.id),
            id: quiz.id,
            kind: "quiz",
            questionCount: quiz.questionCount,
            status: "todo",
            statusLabel: inProgressAttempt ? "En cours" : "Assigné",
            title: quiz.title,
        };
    });
    const retryQuizzes = quizzes
        .flatMap((quiz) => {
            const score = bestScores.get(quiz.id);
            const threshold = quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD;
            return score !== undefined && score < threshold ? [{ quiz, score, threshold }] : [];
        })
        .sort((first, second) => first.score - second.score);
    const retryItems = retryQuizzes.map<DashboardActivityItem>(({ quiz, score, threshold }) => {
        const attemptsRemaining = getQuizAttemptsRemaining(
            quiz.maxAttempts,
            completedAttemptCountByQuizId.get(quiz.id) ?? 0,
        );
        const attemptsExhausted = attemptsRemaining === 0;

        return {
            actionLabel: attemptsExhausted ? "Voir le résultat" : "Retenter",
            attemptsRemaining,
            category: dashboardQuizCategory(quiz.categories, quiz.domain),
            date: attemptsExhausted ? "Tentatives épuisées" : `Score cible : ${threshold}%`,
            href: attemptsExhausted
                ? EVALUATION_ROUTES.app.results(quiz.id)
                : EVALUATION_ROUTES.app.quiz(quiz.id),
            id: quiz.id,
            kind: "quiz",
            questionCount: quiz.questionCount,
            score: roundDashboardScore(score),
            status: "retry",
            statusLabel: "À retravailler",
            title: quiz.title,
        };
    });

    return {
        counts: {
            completed: latestCurrentAttemptByQuizId.size,
            retry: retryItems.length,
            todo: todoItems.length,
        },
        items: {
            completed: completedItems.slice(0, DASHBOARD_LIST_LIMIT),
            retry: retryItems.slice(0, DASHBOARD_LIST_LIMIT),
            todo: todoItems.slice(0, DASHBOARD_LIST_LIMIT),
        },
    };
}

function buildRoleplayMetrics(
    sessions: DashboardRoleplaySessionRecord[],
    scenarios: DashboardScenarioRecord[],
    collection: DashboardActivityCollection,
    periodDays: DashboardPeriodDays,
    range: DashboardPeriodRange,
): DashboardMetric[] {
    const currentSessions = sessions.filter((session) =>
        inRange(session.createdAt, range.currentStart, range.currentEndExclusive),
    );
    const previousSessions = sessions.filter((session) =>
        inRange(session.createdAt, range.previousStart, range.currentStart),
    );
    const currentDuration = currentSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const previousDuration = previousSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const distinctScenarioCount = new Set(currentSessions.map((session) => session.scenarioId)).size;
    const visibleScenarioIds = new Set(scenarios.map((scenario) => scenario.id));
    const bestHistoricalScores = getBestDashboardScoresByActivity(
        buildScorePointsFromRoleplays(sessions).filter((point) => visibleScenarioIds.has(point.activityId)),
    );
    const evaluatedTotal = bestHistoricalScores.size;
    const validatedCount = [...bestHistoricalScores.values()].filter(
        (score) => score >= ROLEPLAY_MASTERY_THRESHOLD_PERCENT,
    ).length;

    return [
        {
            detail: "",
            id: "simulation-time",
            label: "Temps total de simulation",
            tone: "blue",
            trend: formatDurationDelta(currentDuration - previousDuration, periodDays),
            value: formatDuration(currentDuration),
        },
        {
            detail: `sur ${distinctScenarioCount} scénario${distinctScenarioCount > 1 ? "s" : ""} distinct${distinctScenarioCount > 1 ? "s" : ""}`,
            id: "completed-simulations",
            label: "Simulations réalisées",
            tone: "blue",
            trend: formatCountDelta(currentSessions.length - previousSessions.length, periodDays),
            value: String(currentSessions.length),
        },
        {
            detail: "Assignés non démarrés",
            id: "pending-scenarios",
            label: "Scénarios à faire",
            tone: "blue",
            value: String(collection.counts.todo),
        },
        {
            detail: evaluatedTotal > 0 ? `${Math.round((validatedCount / evaluatedTotal) * 100)}% de réussite` : "Pas encore de score",
            id: "validated-scenarios",
            label: "Scénarios validés",
            tone: "green",
            value: evaluatedTotal > 0 ? `${validatedCount}/${evaluatedTotal}` : "-",
        },
        {
            detail: "Sous le seuil cible",
            id: "scenarios-to-review",
            label: "Scénarios à retravailler",
            tone: "orange",
            value: String(collection.counts.retry),
        },
    ];
}

function buildQuizMetrics(
    attempts: DashboardQuizAttemptRecord[],
    quizzes: DashboardQuizRecord[],
    collection: DashboardActivityCollection,
    periodDays: DashboardPeriodDays,
    range: DashboardPeriodRange,
): DashboardMetric[] {
    const completedAttempts = attempts.filter((attempt) => attempt.status === "completed" && attempt.completedAt);
    const currentQuizIds = new Set(
        completedAttempts
            .filter((attempt) => attempt.completedAt && inRange(attempt.completedAt, range.currentStart, range.currentEndExclusive))
            .map((attempt) => attempt.quizId),
    );
    const previousQuizIds = new Set(
        completedAttempts
            .filter((attempt) => attempt.completedAt && inRange(attempt.completedAt, range.previousStart, range.currentStart))
            .map((attempt) => attempt.quizId),
    );
    const visibleQuizIds = new Set(quizzes.map((quiz) => quiz.id));
    const evaluatedTotal = new Set(
        completedAttempts.filter((attempt) => visibleQuizIds.has(attempt.quizId)).map((attempt) => attempt.quizId),
    ).size;
    const validatedCount = Math.max(0, evaluatedTotal - collection.counts.retry);

    return [
        {
            detail: "Au moins une tentative terminée",
            id: "completed-quizzes",
            label: "Quiz réalisés",
            tone: "blue",
            trend: formatCountDelta(currentQuizIds.size - previousQuizIds.size, periodDays),
            value: String(currentQuizIds.size),
        },
        {
            detail: "Assignés non terminés",
            id: "pending-quizzes",
            label: "Quiz à faire",
            tone: "blue",
            value: String(collection.counts.todo),
        },
        {
            detail: evaluatedTotal > 0 ? `${Math.round((validatedCount / evaluatedTotal) * 100)}% de réussite` : "Pas encore de score",
            id: "validated-quizzes",
            label: "Quiz validés",
            tone: "green",
            value: evaluatedTotal > 0 ? `${validatedCount}/${evaluatedTotal}` : "-",
        },
        {
            detail: "Sous le seuil recommandé",
            id: "quizzes-to-review",
            label: "Quiz à retravailler",
            tone: "orange",
            value: String(collection.counts.retry),
        },
    ];
}

export function buildDashboardViewData(input: BuildDashboardInput): DashboardViewData {
    const now = input.now ?? new Date();
    const range = getDashboardPeriodRange(input.periodDays, now);
    const roleplayPoints = buildScorePointsFromRoleplays(input.roleplaySessions);
    const quizPoints = buildScorePointsFromQuizzes(input.quizAttempts);
    const currentRoleplayBestScores = getBestDashboardScoresByActivity(
        roleplayPoints.filter((point) => inRange(point.occurredAt, range.currentStart, range.currentEndExclusive)),
    );
    const currentQuizBestScores = getBestDashboardScoresByActivity(
        quizPoints.filter((point) => inRange(point.occurredAt, range.currentStart, range.currentEndExclusive)),
    );
    const roleplays = buildRoleplayCollection(input.scenarios, input.roleplaySessions, range);
    const quizzes = buildQuizCollection(input.quizzes, input.quizAttempts, range);
    const visibleScenarioIds = new Set(input.scenarios.map((scenario) => scenario.id));
    const latestRoleplaySession = sortByDateDescending(
        input.roleplaySessions.filter((session) => visibleScenarioIds.has(session.scenarioId)),
        (session) => session.createdAt,
    )[0];

    return {
        activity: {
            quizzes: buildQuizMetrics(input.quizAttempts, input.quizzes, quizzes, input.periodDays, range),
            roleplays: buildRoleplayMetrics(input.roleplaySessions, input.scenarios, roleplays, input.periodDays, range),
        },
        domainPerformance: {
            quizzes: buildDomainGroups(input.quizzes, currentQuizBestScores, "quiz"),
            roleplays: buildDomainGroups(input.scenarios, currentRoleplayBestScores, "roleplay"),
        },
        generatedAt: now.toISOString(),
        lastRoleplayHref: latestRoleplaySession
            ? ROLEPLAY_ROUTES.app.detail(latestRoleplaySession.scenarioId)
            : null,
        periodDays: input.periodDays,
        performance: buildPerformance(roleplayPoints, quizPoints, input.periodDays, range),
        quizzes,
        roleplays,
    };
}
