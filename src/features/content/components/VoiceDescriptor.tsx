import { Box, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { getOpenAIRealtimeVoice } from "@/lib/openai/realtime-voices";

interface VoiceDescriptorProps {
    characteristic?: string | null;
    className?: string;
    fallback?: string;
}

interface VoiceRecommendationBadgeProps {
    className?: string;
    voiceId?: string | null;
}

export function VoiceRecommendationBadge({ className, voiceId }: VoiceRecommendationBadgeProps) {
    if (!getOpenAIRealtimeVoice(voiceId)?.recommended) return null;

    return (
        <Box className={cn(uiTokens.voice.recommendedBadge, uiTokens.tone.success.soft, className)}>
            Recommandée
        </Box>
    );
}

export function VoiceDescriptor({ characteristic, className, fallback }: VoiceDescriptorProps) {
    const description = characteristic || fallback;
    return description ? <Text className={className}>{description}</Text> : null;
}
