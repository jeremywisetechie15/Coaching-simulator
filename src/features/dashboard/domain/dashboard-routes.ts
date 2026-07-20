import type { DashboardPeriodDays } from "./dashboard";

export const DASHBOARD_ROUTES = {
    api: {
        current: (periodDays: DashboardPeriodDays) => `/api/dashboard?period=${periodDays}`,
    },
    app: {
        current: "/",
    },
} as const;
