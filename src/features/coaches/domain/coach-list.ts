import type { ContentStatus } from "@/features/content/domain";
import { DEFAULT_COACH_VOICE_ID, type VoiceId } from "@/lib/openai/realtime-voices";

export interface CoachListItem {
    avatarSrc: string | null;
    createdAt: string;
    id: string;
    name: string;
    status: ContentStatus;
    voiceCharacteristic: string | null;
    voiceId: string | null;
    voiceName: string;
    voiceRecommended: boolean;
}

export interface CoachEditorValues {
    avatarSrc: string;
    name: string;
    systemInstructions: string;
    voiceId: VoiceId;
}

export const EMPTY_COACH_EDITOR_VALUES: CoachEditorValues = {
    avatarSrc: "",
    name: "",
    systemInstructions: "",
    voiceId: DEFAULT_COACH_VOICE_ID,
};

export function getCoachInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length > 1) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return (name.slice(0, 2) || "IA").toUpperCase();
}
