import {
    AlarmClock,
    BadgeCheck,
    CircleAlert,
    ClipboardCheck,
    Clock3,
    Crosshair,
    ListTodo,
    Target,
    type LucideIcon,
} from "lucide-react";
import {
    DASHBOARD_METRIC_HELP,
    type DashboardMetric,
    type DashboardMetricId,
} from "@/features/dashboard/domain";
import { Box, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

const metricIcons: Record<DashboardMetricId, LucideIcon> = {
    "simulation-time": Clock3,
    "completed-simulations": BadgeCheck,
    "pending-scenarios": AlarmClock,
    "validated-scenarios": Target,
    "scenarios-to-review": CircleAlert,
    "completed-quizzes": ClipboardCheck,
    "pending-quizzes": ListTodo,
    "validated-quizzes": Crosshair,
    "quizzes-to-review": CircleAlert,
};

export function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
    const Icon = metricIcons[metric.id] ?? Target;

    return (
        <Box className={uiTokens.dashboard.metric.card}>
            <Box className="flex items-start justify-between gap-3">
                <Box className="flex min-w-0 items-center gap-2.5">
                    <Box className={`${uiTokens.dashboard.metric.icon} ${uiTokens.dashboard.metric.tone[metric.tone]}`}>
                        <InlineIcon icon={Icon} className="h-4 w-4" />
                    </Box>
                    <Text className={uiTokens.dashboard.metric.label}>{metric.label}</Text>
                </Box>
                <Tooltip content={DASHBOARD_METRIC_HELP[metric.id]}>
                    <span
                        aria-label={`Informations sur ${metric.label}`}
                        className={uiTokens.dashboard.metric.infoIcon}
                        role="img"
                    >
                        ⓘ
                    </span>
                </Tooltip>
            </Box>

            <Box className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <Text className={uiTokens.dashboard.metric.value}>{metric.value}</Text>
                {metric.detail && <Text className={uiTokens.dashboard.metric.detail}>{metric.detail}</Text>}
            </Box>
            {metric.trend && <Text className={uiTokens.dashboard.metric.trend}>{metric.trend}</Text>}
        </Box>
    );
}
