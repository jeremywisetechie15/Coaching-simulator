import type { ContentScoreStatus } from "@/features/content/domain";
import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface QuizDetailStatCellProps {
    helper: string;
    label: string;
    muted?: boolean;
    tone?: ContentScoreStatus | "accent";
    value: string;
}

export function QuizDetailStatCell({
    helper,
    label,
    muted = false,
    tone,
    value,
}: QuizDetailStatCellProps) {
    const toneClass = tone === "accent"
        ? uiTokens.quizDetail.statValueAccent
        : tone
          ? uiTokens.tone[tone].text
          : uiTokens.quizDetail.statValueDefault;

    return (
        <Box className={uiTokens.quizDetail.statCell}>
            <Text className={uiTokens.quizDetail.statLabel}>{label}</Text>
            <Text
                className={cn(
                    uiTokens.quizDetail.statValue,
                    muted
                        ? uiTokens.quizDetail.statValueMuted
                        : toneClass,
                )}
            >
                {value}
            </Text>
            <Text className={uiTokens.quizDetail.statHelper}>{helper}</Text>
        </Box>
    );
}
