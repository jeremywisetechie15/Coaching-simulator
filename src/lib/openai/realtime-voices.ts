/**
 * Supported built-in voice IDs follow the OpenAI Realtime API documentation.
 * Source: https://platform.openai.com/docs/guides/realtime-conversations#voice-options
 * `characteristic` is application display copy; OpenAI only explicitly
 * recommends Marin and Cedar for best quality.
 */
export const OPENAI_REALTIME_VOICES = [
    {
        characteristic: "Neutre et équilibrée",
        id: "alloy",
        name: "Alloy",
        previewSrc: "/audio/openai-voices/openai_voice_Alloy.wav",
        recommended: false,
    },
    {
        characteristic: "Douce et calme",
        id: "ash",
        name: "Ash",
        previewSrc: "/audio/openai-voices/openai_voice_Ash.wav",
        recommended: false,
    },
    {
        characteristic: "Mélodique et expressive",
        id: "ballad",
        name: "Ballad",
        previewSrc: "/audio/openai-voices/openai_voice_Ballad.wav",
        recommended: false,
    },
    {
        characteristic: "Chaleureuse",
        id: "coral",
        name: "Coral",
        previewSrc: "/audio/openai-voices/openai_voice_Coral.wav",
        recommended: false,
    },
    {
        characteristic: "Dynamique",
        id: "echo",
        name: "Echo",
        previewSrc: "/audio/openai-voices/openai_voice_Echo.wav",
        recommended: false,
    },
    {
        characteristic: "Calme et posée",
        id: "sage",
        name: "Sage",
        previewSrc: "/audio/openai-voices/openai_voice_Sage.wav",
        recommended: false,
    },
    {
        characteristic: "Vive et enjouée",
        id: "shimmer",
        name: "Shimmer",
        previewSrc: "/audio/openai-voices/openai_voice_Shimmer.wav",
        recommended: false,
    },
    {
        characteristic: "Narrative",
        id: "verse",
        name: "Verse",
        previewSrc: "/audio/openai-voices/openai_voice_Verse.wav",
        recommended: false,
    },
    {
        characteristic: null,
        id: "marin",
        name: "Marin",
        previewSrc: "/audio/openai-voices/openai_voice_Marin.wav",
        recommended: true,
    },
    {
        characteristic: null,
        id: "cedar",
        name: "Cedar",
        previewSrc: "/audio/openai-voices/openai_voice_Cedar.wav",
        recommended: true,
    },
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
