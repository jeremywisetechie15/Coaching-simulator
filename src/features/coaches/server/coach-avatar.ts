import type { SupabaseClient } from "@supabase/supabase-js";
import { COACH_AVATAR_BUCKET } from "@/features/coaches/domain/coach-list";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import {
    copyEntityAvatar,
    isOwnedEntityAvatarPath,
    removeEntityAvatar,
    uploadEntityAvatar,
} from "@/lib/uploads/entity-avatar-storage";

const COACH_AVATAR_STORAGE = {
    bucket: COACH_AVATAR_BUCKET,
    invalidFileCode: "COACH_AVATAR_INVALID",
    purpose: CONTENT_UPLOAD_PURPOSES.coachAvatar,
} as const;

export function copyCoachAvatar(
    supabase: SupabaseClient,
    sourcePath: string | null | undefined,
    targetCoachId: string,
) {
    return copyEntityAvatar(supabase, COACH_AVATAR_STORAGE, sourcePath, targetCoachId);
}

export function isOwnedCoachAvatarPath(path: string | null | undefined, coachId: string) {
    return isOwnedEntityAvatarPath(COACH_AVATAR_STORAGE, path, coachId);
}

export function uploadCoachAvatar(supabase: SupabaseClient, coachId: string, file: File) {
    return uploadEntityAvatar(supabase, COACH_AVATAR_STORAGE, coachId, file);
}

export function removeCoachAvatar(
    supabase: SupabaseClient,
    path: string | null | undefined,
) {
    return removeEntityAvatar(supabase, COACH_AVATAR_STORAGE, path);
}
