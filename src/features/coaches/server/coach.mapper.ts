import type { CoachEditorValues, CoachListItem } from "@/features/coaches/domain/coach-list";
import {
    COACH_DISC_PROFILE,
    COACH_DISC_PROFILES,
    COACHING_STYLE,
    COACHING_STYLES,
    type CoachDiscProfile,
    type CoachingStyle,
} from "@/features/coaches/domain/coach-profile";
import {
    CONTENT_DOMAINS,
    CONTENT_STATUS,
    normalizeContentStatus,
    type ContentDomain,
    type ContentStatus,
} from "@/features/content/domain";
import { getOpenAIRealtimeVoice, isOpenAIRealtimeVoiceId } from "@/lib/openai/realtime-voices";

export const COACH_SELECT =
    "id, name, voice_id, system_instructions, avatar_url, expertise_domain, coaching_style, disc_profile, diploma, certifications, created_at, status";

export interface CoachRow {
    avatar_url: string | null;
    certifications: string | null;
    coaching_style: string | null;
    created_at: string | null;
    diploma: string | null;
    disc_profile: string | null;
    expertise_domain: string | null;
    id: string;
    name: string;
    status?: ContentStatus | string | null;
    system_instructions: string;
    voice_id: string | null;
}

function normalizeExpertiseDomain(value: string | null | undefined): ContentDomain | "" {
    return CONTENT_DOMAINS.includes(value as ContentDomain) ? (value as ContentDomain) : "";
}

function normalizeCoachingStyle(value: string | null | undefined): CoachingStyle {
    return COACHING_STYLES.includes(value as CoachingStyle) ? (value as CoachingStyle) : COACHING_STYLE.optimistic;
}

function normalizeCoachDiscProfile(value: string | null | undefined): CoachDiscProfile {
    return COACH_DISC_PROFILES.includes(value as CoachDiscProfile)
        ? (value as CoachDiscProfile)
        : COACH_DISC_PROFILE.stable;
}

function formatDate(value: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

export function mapCoachRowToListItem(row: CoachRow): CoachListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        avatarSrc: row.avatar_url,
        createdAt: formatDate(row.created_at),
        id: row.id,
        name: row.name,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
        voiceRecommended: voice?.recommended ?? false,
    };
}

export function mapCoachRowToEditorValues(row: CoachRow): CoachEditorValues {
    const voiceId = row.voice_id && isOpenAIRealtimeVoiceId(row.voice_id) ? row.voice_id : "cedar";

    return {
        avatarSrc: row.avatar_url ?? "",
        certifications: row.certifications ?? "",
        coachingStyle: normalizeCoachingStyle(row.coaching_style),
        diploma: row.diploma ?? "",
        discProfile: normalizeCoachDiscProfile(row.disc_profile),
        expertiseDomain: normalizeExpertiseDomain(row.expertise_domain),
        name: row.name,
        systemInstructions: row.system_instructions,
        voiceId,
    };
}
