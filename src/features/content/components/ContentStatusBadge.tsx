import { CONTENT_STATUS, CONTENT_STATUS_LABELS, type ContentStatus } from "@/features/content/domain";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ContentStatusBadgeProps {
    status: ContentStatus;
}

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
    const tone = status === CONTENT_STATUS.published
        ? uiTokens.tone.success.soft
        : status === CONTENT_STATUS.draft
          ? uiTokens.tone.warning.soft
          : uiTokens.tone.neutral.soft;

    return (
        <Box className={cn("inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-bold", tone)}>
            {CONTENT_STATUS_LABELS[status]}
        </Box>
    );
}
