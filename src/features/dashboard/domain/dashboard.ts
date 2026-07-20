export const DASHBOARD_PERIOD_DAYS = [7, 30, 90] as const;

export type DashboardPeriodDays = (typeof DASHBOARD_PERIOD_DAYS)[number];

export const DASHBOARD_PERIOD_OPTIONS: ReadonlyArray<{
    label: string;
    value: DashboardPeriodDays;
}> = [
    { label: "7 jours", value: 7 },
    { label: "30 jours", value: 30 },
    { label: "90 jours", value: 90 },
];

export type DashboardMetricTone = "blue" | "green" | "orange";

export const DASHBOARD_METRIC_HELP = {
    "completed-quizzes": "Le nombre de quiz différents terminés pendant la période choisie.",
    "completed-simulations": "Le nombre de simulations terminées pendant la période choisie. Rejouer un scénario compte à nouveau.",
    "pending-quizzes": "Les quiz accessibles sans tentative terminée. Un quiz en cours reste ici.",
    "pending-scenarios": "Les scénarios accessibles que vous n’avez encore jamais commencés.",
    "quizzes-to-review": "Les quiz terminés dont votre meilleur score reste sous le seuil de réussite.",
    "scenarios-to-review": "Les scénarios dont votre meilleur score reste sous le seuil attendu.",
    "simulation-time": "Le temps cumulé passé dans vos simulations terminées pendant la période choisie.",
    "validated-quizzes": "Les quiz dont votre meilleur score atteint leur seuil de réussite.",
    "validated-scenarios": "Les scénarios dont votre meilleur score atteint le seuil attendu.",
} as const;

export type DashboardMetricId = keyof typeof DASHBOARD_METRIC_HELP;

export interface DashboardMetric {
    detail: string;
    id: DashboardMetricId;
    label: string;
    tone: DashboardMetricTone;
    trend?: string;
    value: string;
}

export interface DashboardScoreSummary {
    label: string;
    sampleSize: number;
    tone: "roleplay" | "quiz";
    trend: number | null;
    value: number | null;
}

export interface DashboardChartSeries {
    label: string;
    tone: "roleplay" | "quiz";
    values: Array<number | null>;
}

export interface DashboardPerformanceSnapshot {
    chartLabels: string[];
    scoreSummaries: DashboardScoreSummary[];
    series: DashboardChartSeries[];
}

export interface DashboardDomainItem {
    label: string;
    score: number;
}

export interface DashboardDomainGroup {
    id: string;
    items?: DashboardDomainItem[];
    label: string;
    score: number | null;
}

export type DashboardActivityStatus = "completed" | "todo" | "retry";
export type DashboardActivityKind = "roleplay" | "quiz";

export interface DashboardActivityItem {
    actionLabel: string;
    attemptsRemaining?: number | null;
    category: string;
    date: string;
    duration?: string;
    href: string;
    id: string;
    imageSrc?: string;
    kind: DashboardActivityKind;
    name?: string;
    questionCount?: number;
    score?: number;
    status: DashboardActivityStatus;
    statusLabel: string;
    title: string;
}

export interface DashboardActivityCollection {
    counts: Record<DashboardActivityStatus, number>;
    items: Record<DashboardActivityStatus, DashboardActivityItem[]>;
}

export interface DashboardViewData {
    activity: {
        quizzes: DashboardMetric[];
        roleplays: DashboardMetric[];
    };
    domainPerformance: {
        quizzes: DashboardDomainGroup[];
        roleplays: DashboardDomainGroup[];
    };
    generatedAt: string;
    lastRoleplayHref: string | null;
    periodDays: DashboardPeriodDays;
    performance: DashboardPerformanceSnapshot;
    quizzes: DashboardActivityCollection;
    roleplays: DashboardActivityCollection;
}

export const DASHBOARD_ACTIVITY_TABS: ReadonlyArray<{
    id: DashboardActivityStatus;
    label: string;
}> = [
    { id: "completed", label: "Réalisés" },
    { id: "todo", label: "À faire" },
    { id: "retry", label: "À retravailler" },
];

export function isDashboardPeriodDays(value: number): value is DashboardPeriodDays {
    return DASHBOARD_PERIOD_DAYS.includes(value as DashboardPeriodDays);
}

export function roundDashboardScore(value: number) {
    return Math.round(value);
}

export function getDefaultDashboardActivityStatus(
    collection: DashboardActivityCollection,
): DashboardActivityStatus {
    if (collection.counts.todo > 0) return "todo";
    if (collection.counts.retry > 0) return "retry";
    return "completed";
}
