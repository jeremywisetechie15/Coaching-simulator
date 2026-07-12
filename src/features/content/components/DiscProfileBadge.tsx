import type { DiscProfileValue } from "@/features/content/domain";
import { getDiscProfileTone } from "@/features/content/domain";
import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DiscProfileBadgeProps {
    className?: string;
    profile: DiscProfileValue;
}

export function DiscProfileBadge({ className, profile }: DiscProfileBadgeProps) {
    const tone = getDiscProfileTone(profile);

    return (
        <Box className={cn(uiTokens.discProfile.badge, uiTokens.discProfile.selected[tone], className)}>
            {profile}
        </Box>
    );
}
