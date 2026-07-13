import type { SupabaseClient } from "@supabase/supabase-js";
import { PERSONA_AVATAR_BUCKET } from "@/features/personas/domain/persona-list";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import {
    copyEntityAvatar,
    isOwnedEntityAvatarPath,
    removeEntityAvatar,
    uploadEntityAvatar,
} from "@/lib/uploads/entity-avatar-storage";

const PERSONA_AVATAR_STORAGE = {
    bucket: PERSONA_AVATAR_BUCKET,
    invalidFileCode: "PERSONA_AVATAR_INVALID",
    purpose: CONTENT_UPLOAD_PURPOSES.personaAvatar,
} as const;

export function copyPersonaAvatar(
    supabase: SupabaseClient,
    sourcePath: string | null | undefined,
    targetPersonaId: string,
) {
    return copyEntityAvatar(supabase, PERSONA_AVATAR_STORAGE, sourcePath, targetPersonaId);
}

export function isOwnedPersonaAvatarPath(path: string | null | undefined, personaId: string) {
    return isOwnedEntityAvatarPath(PERSONA_AVATAR_STORAGE, path, personaId);
}

export function uploadPersonaAvatar(supabase: SupabaseClient, personaId: string, file: File) {
    return uploadEntityAvatar(supabase, PERSONA_AVATAR_STORAGE, personaId, file);
}

export function removePersonaAvatar(
    supabase: SupabaseClient,
    path: string | null | undefined,
) {
    return removeEntityAvatar(supabase, PERSONA_AVATAR_STORAGE, path);
}
