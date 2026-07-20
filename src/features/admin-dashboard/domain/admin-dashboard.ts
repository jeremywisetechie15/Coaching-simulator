import type { ContentStatus } from "@/features/content/domain";
import type { DashboardPeriodDays } from "@/features/dashboard/domain";

export const ADMIN_DASHBOARD_ORGANIZATION_ALL = "all" as const;

export const ADMIN_DASHBOARD_FEATURES = {
    aiUsage: false,
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
    skills: "skills",
} as const;

export type AdminDashboardMetricId =
    (typeof ADMIN_DASHBOARD_METRIC_ID)[keyof typeof ADMIN_DASHBOARD_METRIC_ID];

export type AdminDashboardTone = "blue" | "green" | "orange" | "purple" | "red";

export interface AdminDashboardMetric {
    detail: string;
    id: AdminDashboardMetricId;
    label: string;
    tone: AdminDashboardTone;
    value: string;
}

export const ADMIN_DASHBOARD_ACTIVITY_SERIES_ID = {
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

export const ADMIN_DASHBOARD_MOCK_SECTION = {
    aiCredits: "ai-credits",
} as const;

export type AdminDashboardMockSection =
    (typeof ADMIN_DASHBOARD_MOCK_SECTION)[keyof typeof ADMIN_DASHBOARD_MOCK_SECTION];

export interface AdminDashboardMockNotice {
    id: AdminDashboardMockSection;
    reason: string;
}

export interface AdminDashboardOrganizationOption {
    id: string;
    name: string;
}

export const ADMIN_DASHBOARD_QUICK_ACTIONS = [
    { href: "/organizations?create=1", id: "organization", label: "Ajouter une organisation" },
    { href: "/users?invite=1", id: "user", label: "Ajouter un utilisateur" },
    { href: "/methods/new", id: "method", label: "Créer une méthode" },
    { href: "/scorecards/new", id: "scorecard", label: "Créer une scorecard" },
    { href: "/roleplays/new", id: "roleplay", label: "Créer un scénario" },
    { href: "/evaluations/new", id: "quiz", label: "Créer un quiz" },
] as const;

export type AdminDashboardQuickActionId =
    (typeof ADMIN_DASHBOARD_QUICK_ACTIONS)[number]["id"];

export const ADMIN_DASHBOARD_AI_OVERVIEW_ID = {
    alerts: "alerts",
    consumed: "consumed",
    remaining: "remaining",
} as const;

export type AdminDashboardAiOverviewId =
    (typeof ADMIN_DASHBOARD_AI_OVERVIEW_ID)[keyof typeof ADMIN_DASHBOARD_AI_OVERVIEW_ID];

export interface AdminDashboardAiOverview {
    detail: string;
    id: AdminDashboardAiOverviewId;
    label: string;
    tone: AdminDashboardTone;
    value: string;
}

export interface AdminDashboardAiOrganizationUsage {
    allocated: number;
    consumed: number;
    id: string;
    name: string;
    percentConsumed: number;
    remaining: number;
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
    mockedSections: AdminDashboardMockNotice[];
    organizationFilter: AdminDashboardOrganizationFilter;
    organizationPerformance: AdminDashboardOrganizationPerformance[];
    organizations: AdminDashboardOrganizationOption[];
    periodDays: AdminDashboardPeriodDays;
    recentActivities: AdminDashboardRecentActivity[];
    recentContent: AdminDashboardRecentContent[];
    topRoleplays: AdminDashboardTopRoleplay[];
}
