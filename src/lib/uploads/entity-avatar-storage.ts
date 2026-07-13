import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/server/errors";
import {
    type ContentUploadPurpose,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "./content-upload";
import { isStorageAvatarPath, normalizeStorageAvatarPath } from "./avatar-path";
import { fileToStorageUploadBody } from "./storage-upload-body";

export interface EntityAvatarStorageConfig {
    bucket: string;
    invalidFileCode: string;
    purpose: ContentUploadPurpose;
}

export async function copyEntityAvatar(
    supabase: SupabaseClient,
    config: EntityAvatarStorageConfig,
    sourcePath: string | null | undefined,
    targetEntityId: string,
) {
    if (!sourcePath || !isStorageAvatarPath(sourcePath)) return sourcePath ?? null;

    const normalizedSourcePath = normalizeStorageAvatarPath(sourcePath, config.bucket);
    const sourceFileName = normalizedSourcePath.split("/").at(-1) ?? "avatar";
    const targetPath = `${targetEntityId}/${crypto.randomUUID()}-${sourceFileName}`;
    const { error } = await supabase.storage
        .from(config.bucket)
        .copy(normalizedSourcePath, targetPath);

    if (error) throw error;
    return targetPath;
}

export function isOwnedEntityAvatarPath(
    config: EntityAvatarStorageConfig,
    path: string | null | undefined,
    entityId: string,
) {
    if (!path || !isStorageAvatarPath(path)) return false;

    return normalizeStorageAvatarPath(path.trim(), config.bucket).startsWith(`${entityId}/`);
}

export async function uploadEntityAvatar(
    supabase: SupabaseClient,
    config: EntityAvatarStorageConfig,
    entityId: string,
    file: File,
) {
    const validationMessage = validateContentUploadFile(file, config.purpose);
    if (validationMessage) {
        throw new AppError(validationMessage, 400, config.invalidFileCode);
    }

    const path = `${entityId}/${crypto.randomUUID()}-${sanitizeUploadFileName(file.name, file.type)}`;
    const { error } = await supabase.storage
        .from(config.bucket)
        .upload(path, await fileToStorageUploadBody(file), {
            contentType: file.type,
            upsert: false,
        });

    if (error) throw error;
    return path;
}

export async function removeEntityAvatar(
    supabase: SupabaseClient,
    config: EntityAvatarStorageConfig,
    path: string | null | undefined,
) {
    if (!path) return;

    const normalizedPath = normalizeStorageAvatarPath(path, config.bucket);
    const { error } = await supabase.storage.from(config.bucket).remove([normalizedPath]);
    if (error) throw error;
}
