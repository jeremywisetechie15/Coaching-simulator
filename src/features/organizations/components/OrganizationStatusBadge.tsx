import { Box, Text } from "@/lib/ui/atoms";
import {
    getOrganizationStatusLabel,
    type OrganizationStatus,
} from "@/features/organizations/domain/organization-list";

interface OrganizationStatusBadgeProps {
    status: OrganizationStatus;
}

const statusStyles = {
    active: {
        className: "bg-[#DDF8E6] text-[#2A8A41]",
    },
    suspended: {
        className: "bg-[#F2F3F6] text-[#4F5868]",
    },
};

export function OrganizationStatusBadge({ status }: OrganizationStatusBadgeProps) {
    const style = statusStyles[status];

    return (
        <Box
            className={`inline-flex h-8 min-w-[66px] items-center justify-center rounded-lg px-3 ${style.className}`}
        >
            <Text as="span" className="text-[13px] font-semibold leading-none">
                {getOrganizationStatusLabel(status)}
            </Text>
        </Box>
    );
}
