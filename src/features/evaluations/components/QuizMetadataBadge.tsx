import type { ReactNode } from "react";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface QuizMetadataBadgeProps {
    children: ReactNode;
    className?: string;
    tone: "category" | "difficulty" | "type";
}

const TONE_CLASS = {
    category: uiTokens.tone.primary.soft,
    difficulty: uiTokens.tone.warning.soft,
    type: uiTokens.tone.info.soft,
} as const;

export function QuizMetadataBadge({ children, className, tone }: QuizMetadataBadgeProps) {
    return (
        <Box
            className={cn(
                uiTokens.quizBadge.base,
                TONE_CLASS[tone],
                className,
            )}
        >
            {children}
        </Box>
    );
}
