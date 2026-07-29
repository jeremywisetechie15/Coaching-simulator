import type { ReactNode } from "react";
import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import styles from "./AnimatedEntityHeader.module.css";

export type AnimatedEntityHeaderTone = keyof typeof uiTokens.entityHeader.tone;

interface AnimatedEntityHeaderProps {
    actions?: ReactNode;
    className?: string;
    title: string;
    tone: AnimatedEntityHeaderTone;
}

export function AnimatedEntityHeader({
    actions,
    className,
    title,
    tone,
}: AnimatedEntityHeaderProps) {
    return (
        <Box
            as="header"
            className={cn(
                uiTokens.entityHeader.root,
                uiTokens.entityHeader.tone[tone],
                styles.root,
                className,
            )}
        >
            <Box
                aria-hidden="true"
                className={cn(uiTokens.entityHeader.haloPrimary, styles.haloPrimary)}
            />
            <Box
                aria-hidden="true"
                className={cn(uiTokens.entityHeader.haloSecondary, styles.haloSecondary)}
            />
            <Box
                aria-hidden="true"
                className={cn(uiTokens.entityHeader.haloTertiary, styles.haloTertiary)}
            />

            <Box aria-hidden="true" className={uiTokens.entityHeader.waves}>
                <svg
                    className={cn(uiTokens.entityHeader.wave, styles.waveForward)}
                    focusable="false"
                    preserveAspectRatio="none"
                    viewBox="0 0 2400 120"
                >
                    <path
                        d="M0 60 C 300 0 600 120 900 60 C 1200 0 1500 120 1800 60 C 2100 0 2400 120 2400 60 L2400 120 L0 120 Z"
                        fill="currentColor"
                        fillOpacity="0.12"
                    />
                </svg>
                <svg
                    className={cn(uiTokens.entityHeader.wave, styles.waveBackward)}
                    focusable="false"
                    preserveAspectRatio="none"
                    viewBox="0 0 2400 120"
                >
                    <path
                        d="M0 80 C 300 30 600 130 900 80 C 1200 30 1500 130 1800 80 C 2100 30 2400 130 2400 80 L2400 120 L0 120 Z"
                        fill="currentColor"
                        fillOpacity="0.1"
                    />
                </svg>
            </Box>

            <Text as="h1" className={uiTokens.entityHeader.title}>
                {title}
            </Text>

            {actions && <Box className={uiTokens.entityHeader.actions}>{actions}</Box>}
        </Box>
    );
}
