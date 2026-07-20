import { CONTENT_STATUS, type ContentStatus } from "@/features/content/domain";
import {
    getDashboardChartBuckets,
    getDashboardPeriodRange,
} from "@/features/dashboard/domain";
import { EVALUATION_ROUTES } from "@/features/evaluations/domain/evaluation-routes";
import {
    ORGANIZATION_MEMBER_STATUS,
    type OrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";
import {
    ORGANIZATION_STATUS,
    type OrganizationStatus,
} from "@/features/organizations/domain/organization-list";
import {
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
    ROLEPLAY_ROUTES,
} from "@/features/roleplays/domain";
import { PLATFORM_ROLE, type PlatformRole } from "@/features/users/domain/users";
import { formatLongDate } from "@/lib/date/format-date-time";
import {
    ADMIN_DASHBOARD_ACTIVITY_SERIES_ID,
    ADMIN_DASHBOARD_AI_OVERVIEW_ID,
    ADMIN_DASHBOARD_METRIC_ID,
    ADMIN_DASHBOARD_MOCK_SECTION,
    ADMIN_DASHBOARD_ORGANIZATION_ALL,
    type AdminDashboardAiOrganizationUsage,
    type AdminDashboardAiUsage,
    type AdminDashboardMetric,
    type AdminDashboardOrganizationFilter,
    type AdminDashboardOrganizationPerformance,
    type AdminDashboardPeriodDays,
    type AdminDashboardRecentActivity,
    type AdminDashboardRecentContent,
    type AdminDashboardTopRoleplay,
    type AdminDashboardViewData,
} from "./admin-dashboard";

export interface AdminDashboardOrganizationRecord {
    createdAt: string;
    id: string;
    name: string;
    status: OrganizationStatus;
}

export interface AdminDashboardMembershipRecord {
    createdAt: string;
    organizationId: string;
    status: OrganizationMemberStatus;
    userId: string;
}

export interface AdminDashboardContentRecord {
    createdAt: string;
    id: string;
    isActive: boolean;
    organizationId: string | null;
    status: ContentStatus;
    title: string;
    updatedAt: string;
}

export interface AdminDashboardProfileRecord {
    id: string;
    name: string;
    platformRole: PlatformRole;
}

export interface AdminDashboardSessionRecord {
    createdAt: string;
    durationSeconds: number;
    id: string;
    organizationId: string | null;
    scenarioId: string;
    scorePercent: number | null;
    status: string;
    userId: string;
}

export interface AdminDashboardQuizAttemptRecord {
    completedAt: string | null;
    id: string;
    quizId: string;
    scorePercent: number | null;
    startedAt: string;
    status: string;
    userId: string;
}

export interface BuildAdminDashboardInput {
    methods: AdminDashboardContentRecord[];
    memberships: AdminDashboardMembershipRecord[];
    now?: Date;
    organizationFilter: AdminDashboardOrganizationFilter;
    organizations: AdminDashboardOrganizationRecord[];
    periodDays: AdminDashboardPeriodDays;
    profiles: AdminDashboardProfileRecord[];
    quizAttempts: AdminDashboardQuizAttemptRecord[];
    quizzes: AdminDashboardContentRecord[];
    scenarios: AdminDashboardContentRecord[];
    sessions: AdminDashboardSessionRecord[];
    skills: AdminDashboardContentRecord[];
}

function timestamp(value: string | null | undefined) {
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

function inRange(value: string, start: Date, endExclusive: Date) {
    const valueTimestamp = timestamp(value);
    return valueTimestamp >= start.getTime() && valueTimestamp < endExclusive.getTime();
}

function average(values: number[]) {
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizedScore(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, value));
}

function formatCompactNumber(value: number) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}M`;
    }
    if (value >= 1_000) {
        return `${Math.round(value / 1_000)}k`;
    }
    return String(Math.round(value));
}

export function formatAdminDashboardDuration(totalSeconds: number) {
    const safeSeconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);

    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
}

function formatRelativeDate(value: string, now: Date) {
    const deltaMinutes = Math.max(0, Math.floor((now.getTime() - timestamp(value)) / 60_000));
    if (deltaMinutes < 1) return "à l'instant";
    if (deltaMinutes < 60) return `il y a ${deltaMinutes} min`;

    const deltaHours = Math.floor(deltaMinutes / 60);
    if (deltaHours < 24) return `il y a ${deltaHours} h`;

    return formatLongDate(value, "Date indisponible");
}

function bestScoresByKey(
    records: Array<{ key: string; score: number | null }>,
) {
    const result = new Map<string, number>();

    for (const record of records) {
        const score = normalizedScore(record.score);
        if (score === null) continue;
        const current = result.get(record.key);
        if (current === undefined || score > current) result.set(record.key, score);
    }

    return result;
}

function getActiveContext(input: BuildAdminDashboardInput) {
    const activeOrganizations = input.organizations.filter(
        (organization) => organization.status === ORGANIZATION_STATUS.active,
    );
    const activeOrganizationIds = new Set(activeOrganizations.map((organization) => organization.id));
    const activeMemberships = input.memberships.filter(
        (membership) =>
            membership.status === ORGANIZATION_MEMBER_STATUS.active
            && activeOrganizationIds.has(membership.organizationId),
    );
    const organizationIdsByUserId = new Map<string, string[]>();

    for (const membership of activeMemberships) {
        organizationIdsByUserId.set(membership.userId, [
            ...(organizationIdsByUserId.get(membership.userId) ?? []),
            membership.organizationId,
        ]);
    }

    return { activeMemberships, activeOrganizations, activeOrganizationIds, organizationIdsByUserId };
}

function matchesOrganizationFilter(
    organizationIds: readonly string[],
    filter: AdminDashboardOrganizationFilter,
) {
    if (organizationIds.length === 0) return false;
    return filter === ADMIN_DASHBOARD_ORGANIZATION_ALL || organizationIds.includes(filter);
}

function contentMatchesOrganization(
    content: AdminDashboardContentRecord,
    filter: AdminDashboardOrganizationFilter,
) {
    return filter === ADMIN_DASHBOARD_ORGANIZATION_ALL || content.organizationId === filter;
}

function organizationIdsForSession(
    session: AdminDashboardSessionRecord,
    activeOrganizationIds: Set<string>,
    organizationIdsByUserId: Map<string, string[]>,
) {
    if (session.organizationId && activeOrganizationIds.has(session.organizationId)) {
        return [session.organizationId];
    }
    return organizationIdsByUserId.get(session.userId) ?? [];
}

function eligibleSessions(input: BuildAdminDashboardInput) {
    return input.sessions.filter(
        (session) =>
            session.status === "completed"
            && session.durationSeconds >= MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
    );
}

function completedQuizAttempts(input: BuildAdminDashboardInput) {
    return input.quizAttempts.filter(
        (attempt) => attempt.status === "completed" && Boolean(attempt.completedAt),
    );
}

function buildMetrics(
    input: BuildAdminDashboardInput,
    currentSessions: AdminDashboardSessionRecord[],
    currentQuizAttempts: AdminDashboardQuizAttemptRecord[],
    activeMemberships: AdminDashboardMembershipRecord[],
    activeOrganizations: AdminDashboardOrganizationRecord[],
    sessionOrganizationIds: (session: AdminDashboardSessionRecord) => string[],
    quizOrganizationIds: (attempt: AdminDashboardQuizAttemptRecord) => string[],
    currentStart: Date,
    currentEndExclusive: Date,
): AdminDashboardMetric[] {
    const scopedMemberships = activeMemberships.filter((membership) =>
        matchesOrganizationFilter([membership.organizationId], input.organizationFilter),
    );
    const activeUserIds = new Set(scopedMemberships.map((membership) => membership.userId));
    const recentlyAddedUserIds = new Set(
        scopedMemberships
            .filter((membership) => inRange(membership.createdAt, currentStart, currentEndExclusive))
            .map((membership) => membership.userId),
    );
    const scopedOrganizations = activeOrganizations.filter((organization) =>
        matchesOrganizationFilter([organization.id], input.organizationFilter),
    );
    const organizationsWithActivity = new Set([
        ...currentSessions.flatMap(sessionOrganizationIds),
        ...currentQuizAttempts.flatMap(quizOrganizationIds),
    ]);
    const scopedScenarios = input.scenarios.filter((content) =>
        contentMatchesOrganization(content, input.organizationFilter),
    );
    const scopedQuizzes = input.quizzes.filter((content) =>
        contentMatchesOrganization(content, input.organizationFilter),
    );
    const scopedMethods = input.methods.filter((content) =>
        contentMatchesOrganization(content, input.organizationFilter),
    );
    const scopedSkills = input.skills.filter((content) =>
        contentMatchesOrganization(content, input.organizationFilter),
    );
    const publishedCount = (contents: AdminDashboardContentRecord[]) => contents.filter(
        (content) => content.status === CONTENT_STATUS.published && content.isActive,
    ).length;
    const draftCount = (contents: AdminDashboardContentRecord[]) => contents.filter(
        (content) => content.status === CONTENT_STATUS.draft && content.isActive,
    ).length;
    const roleplaySeconds = currentSessions.reduce((sum, session) => sum + session.durationSeconds, 0);
    const quizSeconds = currentQuizAttempts.reduce((sum, attempt) => {
        if (!attempt.completedAt) return sum;
        return sum + Math.max(0, (timestamp(attempt.completedAt) - timestamp(attempt.startedAt)) / 1000);
    }, 0);
    const currentSkills = scopedSkills.filter(
        (skill) => skill.status !== CONTENT_STATUS.archived && skill.isActive,
    );
    const newSkills = currentSkills.filter((skill) =>
        inRange(skill.createdAt, currentStart, currentEndExclusive),
    ).length;

    return [
        {
            detail: `+${recentlyAddedUserIds.size} sur ${input.periodDays} derniers jours`,
            id: ADMIN_DASHBOARD_METRIC_ID.activeUsers,
            label: "Utilisateurs actifs",
            tone: "green",
            value: String(activeUserIds.size),
        },
        {
            detail: `${organizationsWithActivity.size} avec activité récente`,
            id: ADMIN_DASHBOARD_METRIC_ID.activeOrganizations,
            label: "Entreprises actives",
            tone: "blue",
            value: String(scopedOrganizations.length),
        },
        {
            detail: `${draftCount(scopedScenarios)} brouillon${draftCount(scopedScenarios) > 1 ? "s" : ""}`,
            id: ADMIN_DASHBOARD_METRIC_ID.publishedRoleplays,
            label: "Roleplays publiés",
            tone: "purple",
            value: String(publishedCount(scopedScenarios)),
        },
        {
            detail: `${draftCount(scopedQuizzes)} brouillon${draftCount(scopedQuizzes) > 1 ? "s" : ""}`,
            id: ADMIN_DASHBOARD_METRIC_ID.publishedQuizzes,
            label: "Quiz publiés",
            tone: "blue",
            value: String(publishedCount(scopedQuizzes)),
        },
        {
            detail: `${draftCount(scopedMethods)} brouillon${draftCount(scopedMethods) > 1 ? "s" : ""}`,
            id: ADMIN_DASHBOARD_METRIC_ID.publishedMethods,
            label: "Méthodes publiées",
            tone: "purple",
            value: String(publishedCount(scopedMethods)),
        },
        {
            detail: `${newSkills} nouvelle${newSkills > 1 ? "s" : ""}`,
            id: ADMIN_DASHBOARD_METRIC_ID.skills,
            label: "Compétences ajoutées",
            tone: "red",
            value: String(currentSkills.length),
        },
        {
            detail: `${formatAdminDashboardDuration(roleplaySeconds)} roleplay · ${formatAdminDashboardDuration(quizSeconds)} quiz`,
            id: ADMIN_DASHBOARD_METRIC_ID.learningTime,
            label: "Temps total d’apprentissage",
            tone: "green",
            value: formatAdminDashboardDuration(roleplaySeconds + quizSeconds),
        },
    ];
}

function buildActivity(
    input: BuildAdminDashboardInput,
    sessions: AdminDashboardSessionRecord[],
    attempts: AdminDashboardQuizAttemptRecord[],
    range: ReturnType<typeof getDashboardPeriodRange>,
) {
    const buckets = getDashboardChartBuckets(input.periodDays, range);
    const countByBucket = (dates: string[]) => buckets.map((bucket) => dates.filter((date) =>
        inRange(date, bucket.start, bucket.endExclusive),
    ).length);
    const roleplayValues = countByBucket(sessions.map((session) => session.createdAt));
    const quizValues = countByBucket(attempts.flatMap((attempt) => attempt.completedAt ? [attempt.completedAt] : []));

    return {
        labels: buckets.map((bucket) => bucket.label),
        series: [
            { id: ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.roleplays, label: "Roleplays joués", values: roleplayValues },
            { id: ADMIN_DASHBOARD_ACTIVITY_SERIES_ID.quizzes, label: "Quiz joués", values: quizValues },
        ],
    };
}

function buildMockAiUsage(
    organizations: AdminDashboardOrganizationRecord[],
): AdminDashboardAiUsage {
    const allocationPattern = [100_000, 150_000, 80_000, 50_000, 60_000];
    const consumptionPattern = [0.72, 0.88, 0.39, 0.98, 0.7];
    const rows: AdminDashboardAiOrganizationUsage[] = organizations.slice(0, 5).map((organization, index) => {
        const allocated = allocationPattern[index % allocationPattern.length] ?? 100_000;
        const ratio = consumptionPattern[index % consumptionPattern.length] ?? 0.72;
        const consumed = Math.round(allocated * ratio);

        return {
            allocated,
            consumed,
            id: organization.id,
            name: organization.name,
            percentConsumed: Math.round(ratio * 100),
            remaining: allocated - consumed,
        };
    });
    const allocatedTotal = rows.reduce((sum, row) => sum + row.allocated, 0);
    const consumedTotal = rows.reduce((sum, row) => sum + row.consumed, 0);
    const remainingTotal = allocatedTotal - consumedTotal;
    const alertCount = rows.filter((row) => row.percentConsumed >= 80).length;

    return {
        organizations: rows,
        overview: [
            {
                detail: `Simulation temporaire sur ${rows.length} entreprise${rows.length > 1 ? "s" : ""}`,
                id: ADMIN_DASHBOARD_AI_OVERVIEW_ID.consumed,
                label: "Crédits IA consommés",
                tone: "purple",
                value: formatCompactNumber(consumedTotal),
            },
            {
                detail: allocatedTotal > 0
                    ? `${Math.round((remainingTotal / allocatedTotal) * 100)}% du quota global`
                    : "Aucun quota simulé",
                id: ADMIN_DASHBOARD_AI_OVERVIEW_ID.remaining,
                label: "Crédits IA restants",
                tone: "blue",
                value: formatCompactNumber(remainingTotal),
            },
            {
                detail: "≥80% du quota consommé",
                id: ADMIN_DASHBOARD_AI_OVERVIEW_ID.alerts,
                label: "Entreprises en alerte",
                tone: "red",
                value: String(alertCount),
            },
        ],
    };
}

function buildTopRoleplays(
    sessions: AdminDashboardSessionRecord[],
    scenariosById: Map<string, AdminDashboardContentRecord>,
): AdminDashboardTopRoleplay[] {
    const aggregates = new Map<string, { durationSeconds: number; learners: Set<string>; sessions: number }>();

    for (const session of sessions) {
        if (!scenariosById.has(session.scenarioId)) continue;
        const aggregate = aggregates.get(session.scenarioId) ?? {
            durationSeconds: 0,
            learners: new Set<string>(),
            sessions: 0,
        };
        aggregate.durationSeconds += session.durationSeconds;
        aggregate.learners.add(session.userId);
        aggregate.sessions += 1;
        aggregates.set(session.scenarioId, aggregate);
    }

    return [...aggregates.entries()]
        .map(([scenarioId, aggregate]) => ({
            durationSeconds: aggregate.durationSeconds,
            id: scenarioId,
            learnerCount: aggregate.learners.size,
            sessionCount: aggregate.sessions,
            title: scenariosById.get(scenarioId)?.title ?? "Roleplay",
        }))
        .sort((first, second) =>
            second.sessionCount - first.sessionCount || second.durationSeconds - first.durationSeconds,
        )
        .slice(0, 5);
}

function buildOrganizationPerformance(
    organizations: AdminDashboardOrganizationRecord[],
    activeMemberships: AdminDashboardMembershipRecord[],
    sessions: AdminDashboardSessionRecord[],
    attempts: AdminDashboardQuizAttemptRecord[],
    sessionOrganizationIds: (session: AdminDashboardSessionRecord) => string[],
    quizOrganizationIds: (attempt: AdminDashboardQuizAttemptRecord) => string[],
): AdminDashboardOrganizationPerformance[] {
    return organizations.map((organization) => {
        const organizationSessions = sessions.filter((session) =>
            sessionOrganizationIds(session).includes(organization.id),
        );
        const organizationAttempts = attempts.filter((attempt) =>
            quizOrganizationIds(attempt).includes(organization.id),
        );
        const roleplayScores = bestScoresByKey(organizationSessions.map((session) => ({
            key: `${session.userId}:${session.scenarioId}`,
            score: session.scorePercent,
        })));
        const quizScores = bestScoresByKey(organizationAttempts.map((attempt) => ({
            key: `${attempt.userId}:${attempt.quizId}`,
            score: attempt.scorePercent,
        })));

        return {
            activeLearnerCount: new Set(
                activeMemberships
                    .filter((membership) => membership.organizationId === organization.id)
                    .map((membership) => membership.userId),
            ).size,
            id: organization.id,
            name: organization.name,
            quizScore: average([...quizScores.values()]),
            roleplayScore: average([...roleplayScores.values()]),
        };
    }).sort((first, second) => second.activeLearnerCount - first.activeLearnerCount).slice(0, 5);
}

function buildRecentContent(
    scenarios: AdminDashboardContentRecord[],
    organizationsById: Map<string, AdminDashboardOrganizationRecord>,
): AdminDashboardRecentContent[] {
    return scenarios
        .filter((scenario) =>
            scenario.isActive
            && (scenario.status === CONTENT_STATUS.published || scenario.status === CONTENT_STATUS.draft),
        )
        .sort((first, second) => timestamp(second.updatedAt) - timestamp(first.updatedAt))
        .slice(0, 3)
        .map((scenario) => ({
            date: formatLongDate(scenario.updatedAt, "Date indisponible"),
            href: ROLEPLAY_ROUTES.app.edit(scenario.id),
            id: scenario.id,
            organizationName: scenario.organizationId
                ? organizationsById.get(scenario.organizationId)?.name ?? "Organisation inconnue"
                : "Public",
            status: scenario.status as Extract<ContentStatus, "draft" | "published">,
            title: scenario.title,
        }));
}

function buildRecentActivities(
    sessions: AdminDashboardSessionRecord[],
    attempts: AdminDashboardQuizAttemptRecord[],
    scenariosById: Map<string, AdminDashboardContentRecord>,
    quizzesById: Map<string, AdminDashboardContentRecord>,
    profilesById: Map<string, AdminDashboardProfileRecord>,
    organizationsById: Map<string, AdminDashboardOrganizationRecord>,
    sessionOrganizationIds: (session: AdminDashboardSessionRecord) => string[],
    quizOrganizationIds: (attempt: AdminDashboardQuizAttemptRecord) => string[],
    now: Date,
): AdminDashboardRecentActivity[] {
    const roleplayActivities: Array<AdminDashboardRecentActivity & { sortDate: string }> = sessions.flatMap((session) => {
        const scenario = scenariosById.get(session.scenarioId);
        if (!scenario) return [];
        const organizationId = sessionOrganizationIds(session)[0];
        const score = normalizedScore(session.scorePercent);

        return [{
            detail: score === null ? formatAdminDashboardDuration(session.durationSeconds) : `Score ${Math.round(score)}%`,
            href: ROLEPLAY_ROUTES.app.sessionHistoryDetail(session.id),
            id: `roleplay-${session.id}`,
            kind: "roleplay" as const,
            label: `${profilesById.get(session.userId)?.name ?? "Un apprenant"} a terminé le roleplay “${scenario.title}”`,
            organizationName: organizationId
                ? organizationsById.get(organizationId)?.name ?? "Organisation inconnue"
                : "Sans organisation",
            relativeDate: formatRelativeDate(session.createdAt, now),
            sortDate: session.createdAt,
        }];
    });
    const quizActivities: Array<AdminDashboardRecentActivity & { sortDate: string }> = attempts.flatMap((attempt) => {
        if (!attempt.completedAt) return [];
        const quiz = quizzesById.get(attempt.quizId);
        if (!quiz) return [];
        const organizationId = quizOrganizationIds(attempt)[0];
        const score = normalizedScore(attempt.scorePercent);

        return [{
            detail: score === null ? "Quiz terminé" : `Score ${Math.round(score)}%`,
            href: EVALUATION_ROUTES.app.results(attempt.quizId),
            id: `quiz-${attempt.id}`,
            kind: "quiz" as const,
            label: `${profilesById.get(attempt.userId)?.name ?? "Un apprenant"} a soumis le quiz “${quiz.title}”`,
            organizationName: organizationId
                ? organizationsById.get(organizationId)?.name ?? "Organisation inconnue"
                : "Sans organisation",
            relativeDate: formatRelativeDate(attempt.completedAt, now),
            sortDate: attempt.completedAt,
        }];
    });

    return [...roleplayActivities, ...quizActivities]
        .sort((first, second) => timestamp(second.sortDate) - timestamp(first.sortDate))
        .slice(0, 5)
        .map((activity) => ({
            detail: activity.detail,
            href: activity.href,
            id: activity.id,
            kind: activity.kind,
            label: activity.label,
            organizationName: activity.organizationName,
            relativeDate: activity.relativeDate,
        }));
}

export function buildAdminDashboardViewData(input: BuildAdminDashboardInput): AdminDashboardViewData {
    const now = input.now ?? new Date();
    const range = getDashboardPeriodRange(input.periodDays, now);
    const {
        activeMemberships,
        activeOrganizations,
        activeOrganizationIds,
        organizationIdsByUserId,
    } = getActiveContext(input);
    const scopedOrganizations = activeOrganizations.filter((organization) =>
        matchesOrganizationFilter([organization.id], input.organizationFilter),
    );
    const sessionOrganizationIds = (session: AdminDashboardSessionRecord) =>
        organizationIdsForSession(session, activeOrganizationIds, organizationIdsByUserId);
    const quizOrganizationIds = (attempt: AdminDashboardQuizAttemptRecord) =>
        organizationIdsByUserId.get(attempt.userId) ?? [];
    const learnerUserIds = new Set(input.profiles
        .filter((profile) => profile.platformRole === PLATFORM_ROLE.user)
        .map((profile) => profile.id));
    const allScopedSessions = eligibleSessions(input).filter((session) =>
        learnerUserIds.has(session.userId)
        && matchesOrganizationFilter(sessionOrganizationIds(session), input.organizationFilter),
    );
    const allScopedQuizAttempts = completedQuizAttempts(input).filter((attempt) =>
        learnerUserIds.has(attempt.userId)
        && matchesOrganizationFilter(quizOrganizationIds(attempt), input.organizationFilter),
    );
    const currentSessions = allScopedSessions.filter((session) =>
        inRange(session.createdAt, range.currentStart, range.currentEndExclusive),
    );
    const currentQuizAttempts = allScopedQuizAttempts.filter((attempt) =>
        Boolean(attempt.completedAt && inRange(attempt.completedAt, range.currentStart, range.currentEndExclusive)),
    );
    const scopedScenarios = input.scenarios.filter((scenario) =>
        contentMatchesOrganization(scenario, input.organizationFilter),
    );
    const scenariosById = new Map(input.scenarios.map((scenario) => [scenario.id, scenario]));
    const quizzesById = new Map(input.quizzes.map((quiz) => [quiz.id, quiz]));
    const profilesById = new Map(input.profiles.map((profile) => [profile.id, profile]));
    const organizationsById = new Map(input.organizations.map((organization) => [organization.id, organization]));

    return {
        activity: buildActivity(
            input,
            currentSessions,
            currentQuizAttempts,
            range,
        ),
        aiUsage: buildMockAiUsage(scopedOrganizations),
        generatedAt: now.toISOString(),
        metrics: buildMetrics(
            input,
            currentSessions,
            currentQuizAttempts,
            activeMemberships,
            activeOrganizations,
            sessionOrganizationIds,
            quizOrganizationIds,
            range.currentStart,
            range.currentEndExclusive,
        ),
        mockedSections: [
            {
                id: ADMIN_DASHBOARD_MOCK_SECTION.aiCredits,
                reason: "Aucun ledger de crédits ou de tokens IA n’existe encore dans la base.",
            },
        ],
        organizationFilter: input.organizationFilter,
        organizationPerformance: buildOrganizationPerformance(
            scopedOrganizations,
            activeMemberships,
            currentSessions,
            currentQuizAttempts,
            sessionOrganizationIds,
            quizOrganizationIds,
        ),
        organizations: input.organizations
            .slice()
            .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"))
            .map(({ id, name }) => ({ id, name })),
        periodDays: input.periodDays,
        recentActivities: buildRecentActivities(
            allScopedSessions,
            allScopedQuizAttempts,
            scenariosById,
            quizzesById,
            profilesById,
            organizationsById,
            sessionOrganizationIds,
            quizOrganizationIds,
            now,
        ),
        recentContent: buildRecentContent(scopedScenarios, organizationsById),
        topRoleplays: buildTopRoleplays(currentSessions, scenariosById),
    };
}
