import {
    ADMIN_DASHBOARD_METRIC_HELP,
    type AdminDashboardMetric,
} from "@/features/admin-dashboard/domain";
import { adminDashboardMetricIcons } from "./AdminDashboardIcons";
import { AdminDashboardStatCard } from "./AdminDashboardStatCard";

export function AdminDashboardMetricCard({ metric }: { metric: AdminDashboardMetric }) {
    const Icon = adminDashboardMetricIcons[metric.id];

    return <AdminDashboardStatCard
        detail={metric.detail}
        help={ADMIN_DASHBOARD_METRIC_HELP[metric.id]}
        icon={Icon}
        label={metric.label}
        tone={metric.tone}
        value={metric.value}
    />;
}
