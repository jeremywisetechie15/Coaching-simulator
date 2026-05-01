import { ArrowLeft, Plus } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

interface OrganizationsPageHeaderProps {
    onCreateClick: () => void;
    showCreateButton?: boolean;
}

export function OrganizationsPageHeader({
    onCreateClick,
    showCreateButton = true,
}: OrganizationsPageHeaderProps) {
    return (
        <Box className="mb-9 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <Box className="flex items-center gap-7">
                <Button className="flex h-10 w-10 items-center justify-center rounded-full text-[#171B2A] transition hover:bg-white">
                    <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                </Button>
                <Text as="h1" className="text-[26px] font-extrabold tracking-[-0.02em] text-[#171B2A]">
                    Organisations
                </Text>
            </Box>

            {showCreateButton && (
                <Button
                    onClick={onCreateClick}
                    className="flex h-10 items-center justify-center gap-3 rounded-lg bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]"
                >
                    <InlineIcon icon={Plus} className="h-5 w-5" />
                    Créer une organisation
                </Button>
            )}
        </Box>
    );
}
