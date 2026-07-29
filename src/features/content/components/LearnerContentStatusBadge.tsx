import {
    LEARNER_CONTENT_STATUS,
    LEARNER_CONTENT_STATUS_LABELS,
    type LearnerContentStatus,
} from "@/features/content/domain";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface LearnerContentStatusBadgeProps {
    className?: string;
    status: LearnerContentStatus;
}

export function LearnerContentStatusBadge({
    className,
    status,
}: LearnerContentStatusBadgeProps) {
    const tone = status === LEARNER_CONTENT_STATUS.validated
        ? uiTokens.tone.success.soft
        : status === LEARNER_CONTENT_STATUS.retry
          ? uiTokens.tone.warning.soft
          : status === LEARNER_CONTENT_STATUS.completed
            ? uiTokens.tone.info.soft
            : uiTokens.tone.neutral.soft;

    return (
        <Box
            className={cn(
                uiTokens.learnerContentStatus.badge,
                tone,
                className,
            )}
        >
            {LEARNER_CONTENT_STATUS_LABELS[status]}
        </Box>
    );
}
