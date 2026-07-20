import {
    DASHBOARD_ROUTES,
    type DashboardPeriodDays,
    type DashboardViewData,
} from "@/features/dashboard/domain";

interface DashboardPayload {
    dashboard?: DashboardViewData;
    error?: string;
}

export const dashboardQueryKey = (periodDays: DashboardPeriodDays) => [
    "dashboard",
    "current-user",
    periodDays,
] as const;

export async function fetchCurrentUserDashboard(periodDays: DashboardPeriodDays) {
    const response = await fetch(DASHBOARD_ROUTES.api.current(periodDays), {
        cache: "no-store",
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as DashboardPayload | null;

    if (!response.ok || !payload?.dashboard) {
        throw new Error(payload?.error ?? "Impossible de charger votre tableau de bord.");
    }

    return payload.dashboard;
}
