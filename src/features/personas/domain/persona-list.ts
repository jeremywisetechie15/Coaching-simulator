import {
    DEFAULT_OPENAI_REALTIME_VOICE_ID,
    type VoiceId,
} from "@/lib/openai/realtime-voices";
import type { ContentStatus } from "@/features/content/domain";

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
    avatarUrl: string;
    company: string;
    name: string;
    role: string;
    systemInstructions: string;
    voiceId: VoiceId;
}

export const PERSONA_AVATAR_BUCKET = "personas-avatars";

export const EMPTY_PERSONA_EDITOR_VALUES: PersonaEditorValues = {
    avatarUrl: "",
    company: "",
    name: "",
    role: "",
    systemInstructions: "",
    voiceId: DEFAULT_OPENAI_REALTIME_VOICE_ID,
};

export function getPersonaAvatarPublicUrl(avatarPath: string | null | undefined) {
    const normalizedPath = avatarPath?.trim();

    if (!normalizedPath) {
        return null;
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        return null;
    }

    const pathWithoutBucket = normalizedPath.startsWith(`${PERSONA_AVATAR_BUCKET}/`)
        ? normalizedPath.slice(PERSONA_AVATAR_BUCKET.length + 1)
        : normalizedPath;
    const encodedPath = pathWithoutBucket.split("/").map(encodeURIComponent).join("/");

    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PERSONA_AVATAR_BUCKET}/${encodedPath}`;
}

export function getPersonaInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "IA";
    }

    return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
