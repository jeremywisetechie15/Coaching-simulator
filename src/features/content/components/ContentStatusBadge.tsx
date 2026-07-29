import { CONTENT_STATUS, CONTENT_STATUS_LABELS, type ContentStatus } from "@/features/content/domain";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ContentStatusBadgeProps {
    className?: string;
    status: ContentStatus;
}

export function ContentStatusBadge({ className, status }: ContentStatusBadgeProps) {
    const tone = status === CONTENT_STATUS.published
        ? uiTokens.tone.success.soft
        : status === CONTENT_STATUS.draft
          ? uiTokens.tone.warning.soft
          : uiTokens.tone.neutral.soft;

    return (
        <Box className={cn(uiTokens.contentStatus.badge, tone, className)}>
            {CONTENT_STATUS_LABELS[status]}
        </Box>
    );
}
