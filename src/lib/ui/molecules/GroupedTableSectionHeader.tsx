import { ChevronDown, ChevronRight } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";

interface GroupedTableSectionHeaderProps {
    colSpan: number;
    count: number;
    isCollapsed?: boolean;
    label: string;
    onToggle?: () => void;
}

export function GroupedTableSectionHeader({
    colSpan,
    count,
    isCollapsed = false,
    label,
    onToggle,
}: GroupedTableSectionHeaderProps) {
    const content = (
        <>
            <InlineIcon
                icon={isCollapsed ? ChevronRight : ChevronDown}
                className="h-4 w-4 text-[#4F5868]"
            />
            <Text className="text-[15px] font-extrabold text-[#171B2A]">
                {label} ({count})
            </Text>
        </>
    );

    return (
        <Box as="tr" className="h-[50px] border-b border-[#E6E9F0] bg-[#F7F8FA]">
            <Box as="td" colSpan={colSpan} className="px-7">
                {onToggle ? (
                    <Button
                        aria-expanded={!isCollapsed}
                        className="flex w-full items-center gap-3 text-left"
                        onClick={onToggle}
                        type="button"
                    >
                        {content}
                    </Button>
                ) : (
                    <Box className="flex items-center gap-3">{content}</Box>
                )}
            </Box>
        </Box>
    );
}
