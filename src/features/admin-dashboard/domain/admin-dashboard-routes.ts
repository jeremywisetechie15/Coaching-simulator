import type {
    AdminDashboardOrganizationFilter,
    AdminDashboardPeriodDays,
} from "./admin-dashboard";

export const ADMIN_DASHBOARD_ROUTES = {
    api: {
        current: (
            periodDays: AdminDashboardPeriodDays,
            organizationId: AdminDashboardOrganizationFilter,
        ) => `/api/admin-dashboard?period=${periodDays}&organization=${organizationId}`,
    },
    app: {
        current: "/",
    },
} as const;
