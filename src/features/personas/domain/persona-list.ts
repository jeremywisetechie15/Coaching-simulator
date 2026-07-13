import {
    DEFAULT_OPENAI_REALTIME_VOICE_ID,
    type VoiceId,
} from "@/lib/openai/realtime-voices";
import type { ContentStatus } from "@/features/content/domain";
import {
    PERSONA_DISC_PROFILE,
    type PersonaDiscProfile,
} from "./persona-profile";
import {
    getStorageAvatarPublicUrl,
    isStorageAvatarPath,
} from "@/lib/uploads/avatar-path";

export interface PersonaListItem {
    avatarUrl: string | null;
    company: string;
    id: string;
    name: string;
    role: string;
    status: ContentStatus;
    voiceCharacteristic: string | null;
    voiceId: string | null;
    voiceName: string;
}

export interface PersonaEditorValues {
    age: string;
    annualRevenue: string;
    avatarUrl: string;
    childrenCount: string;
    company: string;
    companyDescription: string;
    diploma: string;
    discProfile: PersonaDiscProfile;
    employeeCount: string;
    industry: string;
    maritalStatus: string;
    name: string;
    nationality: string;
    netIncomeBeforeTax: string;
    residenceCountry: string;
    role: string;
    systemInstructions: string;
    voiceId: VoiceId;
}

export interface PersonaDetail extends PersonaEditorValues {
    createdAt: string | null;
    id: string;
    status: ContentStatus;
    updatedAt: string | null;
    voiceCharacteristic: string | null;
    voiceName: string;
}

export const PERSONA_AVATAR_BUCKET = "personas-avatars";

export const EMPTY_PERSONA_EDITOR_VALUES: PersonaEditorValues = {
    age: "",
    annualRevenue: "",
    avatarUrl: "",
    childrenCount: "",
    company: "",
    companyDescription: "",
    diploma: "",
    discProfile: PERSONA_DISC_PROFILE.stable,
    employeeCount: "",
    industry: "",
    maritalStatus: "",
    name: "",
    nationality: "",
    netIncomeBeforeTax: "",
    residenceCountry: "",
    role: "",
    systemInstructions: "",
    voiceId: DEFAULT_OPENAI_REALTIME_VOICE_ID,
};

export function getPersonaAvatarPublicUrl(avatarPath: string | null | undefined) {
    return getStorageAvatarPublicUrl(avatarPath, PERSONA_AVATAR_BUCKET);
}

export function isPersonaAvatarStoragePath(
    avatarPath: string | null | undefined,
): boolean {
    return isStorageAvatarPath(avatarPath);
}

export function getPersonaInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "IA";
    }

    return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
