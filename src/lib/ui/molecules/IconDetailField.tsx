import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export interface IconDetailFieldProps {
    className?: string;
    icon: LucideIcon;
    label: string;
    value: ReactNode;
}

export function IconDetailField({ className, icon, label, value }: IconDetailFieldProps) {
    return (
        <Box className={cn(uiTokens.detailField.root, className)}>
            <Box className={uiTokens.detailField.iconBox}>
                <InlineIcon icon={icon} className={uiTokens.detailField.icon} />
            </Box>
            <Box className="min-w-0">
                <Text className={uiTokens.detailField.label}>{label}</Text>
                <Box className={uiTokens.detailField.value}>{value}</Box>
            </Box>
        </Box>
    );
}
