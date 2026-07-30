import type { SupabaseClient } from "@supabase/supabase-js";
import {
    getCoachAvatarPublicUrl,
    type CoachDetail,
    type CoachEditorValues,
    type CoachListItem,
} from "@/features/coaches/domain/coach-list";
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
import {
    DEFAULT_COACH_VOICE_ID,
    getOpenAIRealtimeVoice,
    resolveOpenAIRealtimeVoiceId,
} from "@/lib/openai/realtime-voices";
import { createSessionBackgroundSignedUrl } from "@/lib/uploads/session-background";

export const COACH_SELECT =
    "id, name, voice_id, system_instructions, avatar_url, background_image_path, expertise_domain, coaching_style, disc_profile, diploma, certifications, created_at, updated_at, status";

export interface CoachRow {
    avatar_url: string | null;
    background_image_path?: string | null;
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
    updated_at: string | null;
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

export function mapCoachRowToListItem(
    row: CoachRow,
    backgroundImageUrl: string | null = null,
): CoachListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        avatarSrc: getCoachAvatarPublicUrl(row.avatar_url),
        backgroundImagePath: row.background_image_path ?? null,
        backgroundImageUrl,
        certifications: row.certifications ?? "",
        coachingStyle: normalizeCoachingStyle(row.coaching_style),
        createdAt: formatDate(row.created_at),
        diploma: row.diploma ?? "",
        discProfile: normalizeCoachDiscProfile(row.disc_profile),
        expertiseDomain: normalizeExpertiseDomain(row.expertise_domain),
        id: row.id,
        name: row.name,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}

export async function mapCoachRowToListItemWithAssets(
    row: CoachRow,
    supabase: SupabaseClient,
) {
    const backgroundImageUrl = await createSessionBackgroundSignedUrl(
        supabase,
        row.background_image_path,
    );

    return mapCoachRowToListItem(row, backgroundImageUrl ?? null);
}

export function mapCoachRowToEditorValues(row: CoachRow): CoachEditorValues {
    const voiceId = resolveOpenAIRealtimeVoiceId(row.voice_id, DEFAULT_COACH_VOICE_ID);

    return {
        avatarSrc: row.avatar_url ?? "",
        backgroundImagePath: row.background_image_path ?? "",
        certifications: row.certifications ?? "",
        coachingStyle: normalizeCoachingStyle(row.coaching_style),
        diploma: row.diploma ?? "",
        discProfile: normalizeCoachDiscProfile(row.disc_profile),
        expertiseDomain: normalizeExpertiseDomain(row.expertise_domain),
        name: row.name,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        systemInstructions: row.system_instructions,
        voiceId,
    };
}

export function mapCoachRowToDetail(
    row: CoachRow,
    backgroundImageUrl: string | null = null,
): CoachDetail {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        ...mapCoachRowToEditorValues(row),
        avatarSrc: getCoachAvatarPublicUrl(row.avatar_url) ?? "",
        backgroundImageUrl,
        createdAt: row.created_at,
        id: row.id,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        updatedAt: row.updated_at,
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}

export async function mapCoachRowToDetailWithAssets(
    row: CoachRow,
    supabase: SupabaseClient,
) {
    const backgroundImageUrl = await createSessionBackgroundSignedUrl(
        supabase,
        row.background_image_path,
    );

    return mapCoachRowToDetail(row, backgroundImageUrl ?? null);
}
