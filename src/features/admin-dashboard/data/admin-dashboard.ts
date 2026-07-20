import {
    ADMIN_DASHBOARD_ROUTES,
    type AdminDashboardOrganizationFilter,
    type AdminDashboardPeriodDays,
    type AdminDashboardViewData,
} from "@/features/admin-dashboard/domain";

interface AdminDashboardPayload {
    dashboard?: AdminDashboardViewData;
    error?: string;
}

export const adminDashboardQueryKey = (
    periodDays: AdminDashboardPeriodDays,
    organizationId: AdminDashboardOrganizationFilter,
) => ["admin-dashboard", periodDays, organizationId] as const;

export async function fetchAdminDashboard(
    periodDays: AdminDashboardPeriodDays,
    organizationId: AdminDashboardOrganizationFilter,
) {
    const response = await fetch(
        ADMIN_DASHBOARD_ROUTES.api.current(periodDays, organizationId),
        {
            cache: "no-store",
            headers: { Accept: "application/json" },
        },
    );
    const payload = (await response.json().catch(() => null)) as AdminDashboardPayload | null;

    if (!response.ok || !payload?.dashboard) {
        throw new Error(payload?.error ?? "Impossible de charger le dashboard administrateur.");
    }

    return payload.dashboard;
}
