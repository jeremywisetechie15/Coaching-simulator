import type { AdminDashboardMockNotice } from "@/features/admin-dashboard/domain";
import { Box, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

export function AdminDashboardMockBadge({ notice }: { notice?: AdminDashboardMockNotice }) {
    if (!notice) return null;

    return (
        <Tooltip content={notice.reason}>
            <Box as="span" className={uiTokens.adminDashboard.mockBadge}>
                <span aria-hidden="true">●</span>
                <Text as="span">Données de démonstration</Text>
            </Box>
        </Tooltip>
    );
}
