import type { ContentDomain, ContentStatus } from "@/features/content/domain";
import { DEFAULT_COACH_VOICE_ID, type VoiceId } from "@/lib/openai/realtime-voices";
import {
    COACH_DISC_PROFILE,
    COACHING_STYLE,
    type CoachDiscProfile,
    type CoachingStyle,
} from "./coach-profile";

export interface CoachListItem {
    avatarSrc: string | null;
    backgroundImagePath: string | null;
    certifications: string;
    coachingStyle: CoachingStyle;
    createdAt: string;
    diploma: string;
    discProfile: CoachDiscProfile;
    expertiseDomain: ContentDomain | "";
    id: string;
    name: string;
    status: ContentStatus;
    voiceCharacteristic: string | null;
    voiceId: string | null;
    voiceName: string;
}

export interface CoachEditorValues {
    avatarSrc: string;
    backgroundImagePath: string;
    certifications: string;
    coachingStyle: CoachingStyle;
    diploma: string;
    discProfile: CoachDiscProfile;
    expertiseDomain: ContentDomain | "";
    name: string;
    systemInstructions: string;
    voiceId: VoiceId;
}

export interface CoachDetail extends CoachEditorValues {
    createdAt: string | null;
    id: string;
    status: ContentStatus;
    updatedAt: string | null;
    voiceCharacteristic: string | null;
    voiceName: string;
}

export const EMPTY_COACH_EDITOR_VALUES: CoachEditorValues = {
    avatarSrc: "",
    backgroundImagePath: "",
    certifications: "",
    coachingStyle: COACHING_STYLE.optimistic,
    diploma: "",
    discProfile: COACH_DISC_PROFILE.stable,
    expertiseDomain: "",
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
