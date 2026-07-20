import type { AdminDashboardMetric } from "@/features/admin-dashboard/domain";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { adminDashboardMetricIcons } from "./AdminDashboardIcons";

export function AdminDashboardMetricCard({ metric }: { metric: AdminDashboardMetric }) {
    const Icon = adminDashboardMetricIcons[metric.id];

    return (
        <CardSurface className={uiTokens.adminDashboard.metric.card}>
            <Box className="flex items-center gap-3">
                <Box className={`${uiTokens.adminDashboard.metric.icon} ${uiTokens.adminDashboard.metric.tone[metric.tone]}`}>
                    <InlineIcon icon={Icon} className="h-5 w-5" />
                </Box>
                <Text className={uiTokens.adminDashboard.metric.label}>{metric.label}</Text>
            </Box>
            <Text className={uiTokens.adminDashboard.metric.value}>{metric.value}</Text>
            <Text className={uiTokens.adminDashboard.metric.detail}>{metric.detail}</Text>
        </CardSurface>
    );
}
