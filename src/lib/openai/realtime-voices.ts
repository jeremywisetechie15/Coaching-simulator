/**
 * Supported built-in voice IDs follow the OpenAI Realtime API documentation.
 * Source: https://platform.openai.com/docs/guides/realtime-conversations#voice-options
 * `characteristic` is application display copy; OpenAI only explicitly
 * recommends Marin and Cedar for best quality.
 */
export const OPENAI_REALTIME_VOICES = [
    { characteristic: "Neutre et équilibrée", id: "alloy", name: "Alloy", recommended: false },
    { characteristic: "Douce et calme", id: "ash", name: "Ash", recommended: false },
    { characteristic: "Mélodique et expressive", id: "ballad", name: "Ballad", recommended: false },
    { characteristic: "Chaleureuse", id: "coral", name: "Coral", recommended: false },
    { characteristic: "Dynamique", id: "echo", name: "Echo", recommended: false },
    { characteristic: "Calme et posée", id: "sage", name: "Sage", recommended: false },
    { characteristic: "Vive et enjouée", id: "shimmer", name: "Shimmer", recommended: false },
    { characteristic: "Narrative", id: "verse", name: "Verse", recommended: false },
    { characteristic: "Qualité recommandée", id: "marin", name: "Marin", recommended: true },
    { characteristic: "Qualité recommandée", id: "cedar", name: "Cedar", recommended: true },
] as const;

export type VoiceId = (typeof OPENAI_REALTIME_VOICES)[number]["id"];

export const DEFAULT_OPENAI_REALTIME_VOICE_ID: VoiceId = "alloy";
export const DEFAULT_COACH_VOICE_ID: VoiceId = "cedar";

export function getOpenAIRealtimeVoice(voiceId: string | null | undefined) {
    return OPENAI_REALTIME_VOICES.find((voice) => voice.id === voiceId);
}

export function isOpenAIRealtimeVoiceId(voiceId: string): voiceId is VoiceId {
    return OPENAI_REALTIME_VOICES.some((voice) => voice.id === voiceId);
}
