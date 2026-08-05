import {
    ArrowRight,
    Award,
    CheckCircle2,
    Sparkles,
    Target,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import {
    getRoleplaySessionResultFeedback,
    type RoleplaySessionResultLevel,
} from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RoleplaySessionResultCardProps {
    onViewEvaluation: () => void;
    scorePercent: number | null;
    validationThreshold: number;
}

const RESULT_ICONS: Record<RoleplaySessionResultLevel, LucideIcon> = {
    green: Award,
    neutral: CheckCircle2,
    orange: TrendingUp,
    red: Target,
    yellow: Sparkles,
};

export function RoleplaySessionResultCard({
    onViewEvaluation,
    scorePercent,
    validationThreshold,
}: RoleplaySessionResultCardProps) {
    const result = getRoleplaySessionResultFeedback(scorePercent, validationThreshold);
    const tone = uiTokens.session.result.tone[result.level];
    const ResultIcon = RESULT_ICONS[result.level];

    return (
        <CardSurface
            aria-live="polite"
            className={cn(uiTokens.session.result.card, tone.card)}
            role="status"
        >
            <Box className={uiTokens.session.result.inner}>
                <Box className={cn(uiTokens.session.result.scorePanel, tone.scorePanel)}>
                    <Text className={uiTokens.session.result.scoreValue}>
                        {result.scorePercent === null ? "—" : `${result.scorePercent}%`}
                    </Text>
                    <Text className={uiTokens.session.result.scoreLabel}>Score global</Text>
                </Box>

                <Box>
                    <Text className={cn(uiTokens.session.result.status, tone.status)}>
                        <InlineIcon icon={ResultIcon} className={uiTokens.session.result.statusIcon} />
                        Session terminée
                    </Text>
                    <Text as="h2" className={uiTokens.session.result.title}>
                        {result.title}
                    </Text>
                    <Text className={uiTokens.session.result.description}>{result.description}</Text>
                    <Button onClick={onViewEvaluation} className={uiTokens.session.result.action}>
                        Voir la notation
                        <InlineIcon icon={ArrowRight} className="h-4 w-4" />
                    </Button>
                </Box>
            </Box>
        </CardSurface>
    );
}
