import { ChevronDown, ChevronRight } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

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
                className={uiTokens.dataTable.groupHeader.icon}
            />
            <Text className={uiTokens.dataTable.groupHeader.label}>
                {label} ({count})
            </Text>
        </>
    );

    return (
        <Box as="tr" className={uiTokens.dataTable.groupHeader.row}>
            <Box
                as="td"
                colSpan={colSpan}
                className={uiTokens.dataTable.groupHeader.cell}
            >
                {onToggle ? (
                    <Button
                        aria-expanded={!isCollapsed}
                        className={uiTokens.dataTable.groupHeader.button}
                        onClick={onToggle}
                        type="button"
                    >
                        {content}
                    </Button>
                ) : (
                    <Box className={uiTokens.dataTable.groupHeader.layout}>
                        {content}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
