import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface QuizDetailStatCellProps {
    accent?: boolean;
    helper: string;
    label: string;
    muted?: boolean;
    value: string;
}

export function QuizDetailStatCell({
    accent = false,
    helper,
    label,
    muted = false,
    value,
}: QuizDetailStatCellProps) {
    return (
        <Box className={uiTokens.quizDetail.statCell}>
            <Text className={uiTokens.quizDetail.statLabel}>{label}</Text>
            <Text
                className={cn(
                    uiTokens.quizDetail.statValue,
                    muted
                        ? uiTokens.quizDetail.statValueMuted
                        : accent
                          ? uiTokens.quizDetail.statValueAccent
                          : uiTokens.quizDetail.statValueDefault,
                )}
            >
                {value}
            </Text>
            <Text className={uiTokens.quizDetail.statHelper}>{helper}</Text>
        </Box>
    );
}
