import { DiscProfileBadge } from "@/features/content/components";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { Box, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface CoachCardBadgesProps {
    coach: CoachListItem;
}

export function CoachCardBadges({ coach }: CoachCardBadgesProps) {
    const profileBadges = [
        { key: "expertise", label: coach.expertiseDomain, tone: uiTokens.coachCard.expertiseBadge },
        { key: "diploma", label: coach.diploma, tone: uiTokens.coachCard.diplomaBadge },
        { key: "certifications", label: coach.certifications, tone: uiTokens.coachCard.certificationBadge },
    ].filter((badge) => badge.label.trim().length > 0);

    return (
        <Box className={uiTokens.coachCard.badgesContainer}>
            <Box className={uiTokens.coachCard.primaryBadges}>
                <Box className={cn(uiTokens.coachCard.badge, uiTokens.coachCard.styleBadge)}>
                    {coach.coachingStyle}
                </Box>
                <DiscProfileBadge className={uiTokens.coachCard.discBadge} profile={coach.discProfile} />
            </Box>

            {profileBadges.length > 0 && (
                <>
                    <Box className={uiTokens.coachCard.badgeDivider} />
                    <Box className={uiTokens.coachCard.profileBadges}>
                        {profileBadges.map((badge) => (
                            <Tooltip key={badge.key} content={badge.label}>
                                <Box className={cn(uiTokens.coachCard.badge, badge.tone)}>
                                    <Text as="span" className={uiTokens.coachCard.badgeLabel}>
                                        {badge.label}
                                    </Text>
                                </Box>
                            </Tooltip>
                        ))}
                    </Box>
                </>
            )}
        </Box>
    );
}
