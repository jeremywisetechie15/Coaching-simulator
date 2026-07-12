import type { SupabaseClient } from "@supabase/supabase-js";
import {
    PERSONA_AVATAR_BUCKET,
    isPersonaAvatarStoragePath,
} from "@/features/personas/domain/persona-list";
import { AppError } from "@/lib/server/errors";
import {
    CONTENT_UPLOAD_PURPOSES,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";

function normalizePersonaAvatarPath(path: string) {
    return path.startsWith(`${PERSONA_AVATAR_BUCKET}/`)
        ? path.slice(PERSONA_AVATAR_BUCKET.length + 1)
        : path;
}

export function isOwnedPersonaAvatarPath(path: string | null | undefined, personaId: string) {
    if (!isPersonaAvatarStoragePath(path)) return false;

    return normalizePersonaAvatarPath(path.trim()).startsWith(`${personaId}/`);
}

export async function uploadPersonaAvatar(
    supabase: SupabaseClient,
    personaId: string,
    file: File,
) {
    const validationMessage = validateContentUploadFile(
        file,
        CONTENT_UPLOAD_PURPOSES.personaAvatar,
    );
    if (validationMessage) {
        throw new AppError(validationMessage, 400, "PERSONA_AVATAR_INVALID");
    }

    const path = `${personaId}/${crypto.randomUUID()}-${sanitizeUploadFileName(file.name, file.type)}`;
    const { error } = await supabase.storage
        .from(PERSONA_AVATAR_BUCKET)
        .upload(path, await fileToStorageUploadBody(file), {
            contentType: file.type,
            upsert: false,
        });

    if (error) throw error;

    return path;
}

export async function removePersonaAvatar(
    supabase: SupabaseClient,
    path: string | null | undefined,
) {
    if (!path) return;

    const normalizedPath = normalizePersonaAvatarPath(path);
    const { error } = await supabase.storage.from(PERSONA_AVATAR_BUCKET).remove([normalizedPath]);
    if (error) throw error;
}
