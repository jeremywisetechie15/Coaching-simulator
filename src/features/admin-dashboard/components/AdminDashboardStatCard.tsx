import type { LucideIcon } from "lucide-react";
import type { AdminDashboardTone } from "@/features/admin-dashboard/domain";
import { Box, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface AdminDashboardStatCardProps {
    detail: string;
    help: string;
    icon: LucideIcon;
    label: string;
    tone: AdminDashboardTone;
    value: string;
}

export function AdminDashboardStatCard({
    detail,
    help,
    icon,
    label,
    tone,
    value,
}: AdminDashboardStatCardProps) {
    return (
        <CardSurface className={uiTokens.adminDashboard.metric.card}>
            <Box className={uiTokens.adminDashboard.metric.header}>
                <Box className={uiTokens.adminDashboard.metric.heading}>
                    <Box className={`${uiTokens.adminDashboard.metric.icon} ${uiTokens.adminDashboard.metric.tone[tone]}`}>
                        <InlineIcon icon={icon} className="h-4 w-4" />
                    </Box>
                    <Text className={uiTokens.adminDashboard.metric.label}>{label}</Text>
                </Box>
                <Tooltip content={help}>
                    <span
                        aria-label={`Informations sur ${label}`}
                        className={uiTokens.adminDashboard.metric.infoIcon}
                        role="img"
                    >
                        ⓘ
                    </span>
                </Tooltip>
            </Box>
            <Text className={uiTokens.adminDashboard.metric.value}>{value}</Text>
            {detail && <Text className={uiTokens.adminDashboard.metric.detail}>{detail}</Text>}
        </CardSurface>
    );
}
