import { Box, Text } from "@/lib/ui/atoms";
import {
    getOrganizationStatusLabel,
    type OrganizationStatus,
} from "@/features/organizations/domain/organization-list";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface OrganizationStatusBadgeProps {
    status: OrganizationStatus;
}

const statusStyles = {
    active: uiTokens.organizations.status.active,
    suspended: uiTokens.organizations.status.suspended,
};

export function OrganizationStatusBadge({ status }: OrganizationStatusBadgeProps) {
    return (
        <Box className={cn(uiTokens.organizations.status.base, statusStyles[status])}>
            <Text as="span">
                {getOrganizationStatusLabel(status)}
            </Text>
        </Box>
    );
}
