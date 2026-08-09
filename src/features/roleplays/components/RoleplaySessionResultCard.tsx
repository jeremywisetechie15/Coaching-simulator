import { scoreLevel } from "@/features/roleplays/domain";
import { Box, Button, CardSurface, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface RoleplaySessionResultCardProps {
    onViewEvaluation: () => void;
    scorePercent: number | null;
    validationThreshold: number;
}

function normalizeScorePercent(value: number | null) {
    if (value === null || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function RoleplaySessionResultCard({
    onViewEvaluation,
    scorePercent,
    validationThreshold,
}: RoleplaySessionResultCardProps) {
    const normalizedScore = normalizeScorePercent(scorePercent);
    const level = normalizedScore === null
        ? "neutral"
        : scoreLevel(normalizedScore, validationThreshold);
    const tone = uiTokens.progression.level[level];

    return (
        <CardSurface
            aria-live="polite"
            className={uiTokens.session.result.card}
            role="status"
        >
            <Box className={uiTokens.session.result.inner}>
                <Text as="h2" className={uiTokens.session.result.status}>
                    Session évaluée
                </Text>
                <Text
                    className={uiTokens.session.result.scoreValue}
                    style={{ color: tone.fill }}
                >
                    {normalizedScore === null ? "—" : `${normalizedScore}%`}
                </Text>
                <Button onClick={onViewEvaluation} className={uiTokens.session.result.action}>
                    Voir l’évaluation
                </Button>
            </Box>
        </CardSurface>
    );
}
