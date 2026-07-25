import type { ContentStatus } from "@/features/content/domain";
import type { DashboardPeriodDays } from "@/features/dashboard/domain";

export const ADMIN_DASHBOARD_ORGANIZATION_ALL = "all" as const;

export const ADMIN_DASHBOARD_FEATURES = {
    aiUsage: true,
} as const;

export type AdminDashboardOrganizationFilter =
    | typeof ADMIN_DASHBOARD_ORGANIZATION_ALL
    | string;

export type AdminDashboardPeriodDays = DashboardPeriodDays;

export const ADMIN_DASHBOARD_METRIC_ID = {
    activeOrganizations: "active-organizations",
    activeUsers: "active-users",
    learningTime: "learning-time",
    publishedMethods: "published-methods",
    publishedQuizzes: "published-quizzes",
    publishedRoleplays: "published-roleplays",
} as const;

export type AdminDashboardMetricId =
    (typeof ADMIN_DASHBOARD_METRIC_ID)[keyof typeof ADMIN_DASHBOARD_METRIC_ID];

export const ADMIN_DASHBOARD_METRIC_HELP: Record<AdminDashboardMetricId, string> = {
    [ADMIN_DASHBOARD_METRIC_ID.activeOrganizations]:
        "Nombre d’organisations actuellement actives.",
    [ADMIN_DASHBOARD_METRIC_ID.activeUsers]:
        "Nombre d’apprenants rattachés activement aux organisations affichées.",
    [ADMIN_DASHBOARD_METRIC_ID.learningTime]:
        "Temps cumulé des simulations éligibles et du temps actif mesuré dans les quiz terminés.",
    [ADMIN_DASHBOARD_METRIC_ID.publishedMethods]:
        "Nombre de méthodes actives actuellement publiées.",
    [ADMIN_DASHBOARD_METRIC_ID.publishedQuizzes]:
        "Nombre de quiz actifs actuellement publiés.",
    [ADMIN_DASHBOARD_METRIC_ID.publishedRoleplays]:
        "Nombre de roleplays actifs actuellement publiés.",
};

export type AdminDashboardTone = "blue" | "green" | "orange" | "purple" | "red";

export interface AdminDashboardMetric {
    detail: string;
    id: AdminDashboardMetricId;
    label: string;
    tone: AdminDashboardTone;
    value: string;
    valueLines?: string[];
}

export const ADMIN_DASHBOARD_ACTIVITY_SERIES_ID = {
    connections: "connections",
    quizzes: "quizzes",
    roleplays: "roleplays",
} as const;

export type AdminDashboardActivitySeriesId =
    (typeof ADMIN_DASHBOARD_ACTIVITY_SERIES_ID)[keyof typeof ADMIN_DASHBOARD_ACTIVITY_SERIES_ID];

export interface AdminDashboardActivitySeries {
    id: AdminDashboardActivitySeriesId;
    label: string;
    values: number[];
}

export interface AdminDashboardActivityChart {
    labels: string[];
    series: AdminDashboardActivitySeries[];
}

export interface AdminDashboardOrganizationOption {
    id: string;
    name: string;
}

export const ADMIN_DASHBOARD_AI_OVERVIEW_ID = {
    askCoach: "ask-coach",
    askPersona: "ask-persona",
    debrief: "debrief",
    improve: "improve",
    simulations: "simulations",
    total: "total",
} as const;

export type AdminDashboardAiOverviewId =
    (typeof ADMIN_DASHBOARD_AI_OVERVIEW_ID)[keyof typeof ADMIN_DASHBOARD_AI_OVERVIEW_ID];

export const ADMIN_DASHBOARD_AI_OVERVIEW_HELP: Record<AdminDashboardAiOverviewId, string> = {
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.askCoach]:
        "Temps actif des échanges « Ask Coach IA » après une simulation.",
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.askPersona]:
        "Temps actif des échanges après session avec un persona IA.",
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.debrief]:
        "Temps actif des débriefings globaux avec le coach IA.",
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.improve]:
        "Temps actif des entraînements d’amélioration réalisés avec le coach IA.",
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.simulations]:
        "Temps cumulé des simulations roleplay éligibles.",
    [ADMIN_DASHBOARD_AI_OVERVIEW_ID.total]:
        "Somme des simulations et de toutes les interactions Persona et Coach IA, y compris les préparations et l’historique non ventilé.",
};

export interface AdminDashboardAiOverview {
    detail: string;
    id: AdminDashboardAiOverviewId;
    label: string;
    tone: AdminDashboardTone;
    value: string;
}

export interface AdminDashboardAiOrganizationUsage {
    activeLearnerCount: number;
    askCoachSeconds: number;
    askPersonaSeconds: number;
    debriefSeconds: number;
    id: string;
    improvementSeconds: number;
    legacyCoachSeconds: number;
    name: string;
    preparationSeconds: number;
    simulationSeconds: number;
    totalSeconds: number;
}

export interface AdminDashboardAiUsage {
    organizations: AdminDashboardAiOrganizationUsage[];
    overview: AdminDashboardAiOverview[];
}

export interface AdminDashboardTopRoleplay {
    durationSeconds: number;
    id: string;
    learnerCount: number;
    sessionCount: number;
    title: string;
}

export interface AdminDashboardOrganizationPerformance {
    activeLearnerCount: number;
    id: string;
    name: string;
    quizScore: number | null;
    roleplayScore: number | null;
}

export interface AdminDashboardRecentContent {
    date: string;
    href: string;
    id: string;
    organizationName: string;
    status: Extract<ContentStatus, "draft" | "published">;
    title: string;
}

export type AdminDashboardRecentActivityKind = "quiz" | "roleplay";

export interface AdminDashboardRecentActivity {
    detail: string;
    href: string;
    id: string;
    kind: AdminDashboardRecentActivityKind;
    label: string;
    organizationName: string;
    relativeDate: string;
}

export interface AdminDashboardViewData {
    activity: AdminDashboardActivityChart;
    aiUsage: AdminDashboardAiUsage;
    generatedAt: string;
    metrics: AdminDashboardMetric[];
    organizationFilter: AdminDashboardOrganizationFilter;
    organizationPerformance: AdminDashboardOrganizationPerformance[];
    organizations: AdminDashboardOrganizationOption[];
    periodDays: AdminDashboardPeriodDays;
    recentActivities: AdminDashboardRecentActivity[];
    recentContent: AdminDashboardRecentContent[];
    topRoleplays: AdminDashboardTopRoleplay[];
}
