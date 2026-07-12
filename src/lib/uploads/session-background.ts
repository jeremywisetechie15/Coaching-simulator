import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/server/errors";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";
import {
    CONTENT_UPLOAD_PURPOSES,
    sanitizeUploadFileName,
    SESSION_BACKGROUND_UPLOAD_BUCKET,
    validateContentUploadFile,
} from "./content-upload";

export const SESSION_BACKGROUND_OWNER = {
    coach: "coaches",
    roleplay: "roleplays",
} as const;

export type SessionBackgroundOwner =
    (typeof SESSION_BACKGROUND_OWNER)[keyof typeof SESSION_BACKGROUND_OWNER];

export const SESSION_BACKGROUND_SIGNED_URL_TTL_SECONDS = 4 * 60 * 60;

export interface UploadedSessionBackground {
    bucket: typeof SESSION_BACKGROUND_UPLOAD_BUCKET;
    path: string;
}

export async function uploadSessionBackground(
    supabase: SupabaseClient,
    owner: SessionBackgroundOwner,
    ownerId: string,
    file: File,
): Promise<UploadedSessionBackground> {
    const validationMessage = validateContentUploadFile(file, CONTENT_UPLOAD_PURPOSES.sessionBackground);
    if (validationMessage) {
        throw new AppError(validationMessage, 400, "SESSION_BACKGROUND_INVALID");
    }

    const path = `${owner}/${ownerId}/${crypto.randomUUID()}-${sanitizeUploadFileName(file.name, file.type)}`;
    const { error } = await supabase.storage
        .from(SESSION_BACKGROUND_UPLOAD_BUCKET)
        .upload(path, await fileToStorageUploadBody(file), { contentType: file.type, upsert: false });

    if (error) throw error;

    return { bucket: SESSION_BACKGROUND_UPLOAD_BUCKET, path };
}

export async function removeSessionBackground(supabase: SupabaseClient, path: string | null | undefined) {
    if (!path) return;

    const { error } = await supabase.storage.from(SESSION_BACKGROUND_UPLOAD_BUCKET).remove([path]);
    if (error) throw error;
}

export async function createSessionBackgroundSignedUrl(
    supabase: SupabaseClient,
    path: string | null | undefined,
) {
    if (!path) return undefined;

    const { data, error } = await supabase.storage
        .from(SESSION_BACKGROUND_UPLOAD_BUCKET)
        .createSignedUrl(path, SESSION_BACKGROUND_SIGNED_URL_TTL_SECONDS);

    if (error) {
        console.error("Unable to sign session background:", error);
        return undefined;
    }

    return data.signedUrl;
}
