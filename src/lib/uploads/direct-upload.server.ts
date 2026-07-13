import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/features/auth/server";
import { AppError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    sanitizeUploadFileName,
    getStoragePathFileName,
    validateContentUploadFile,
    type DirectContentUploadPurpose,
} from "./content-upload";
import {
    buildDirectStorageEndpoint,
    directUploadIntentInputDto,
    getDirectUploadBucket,
    getDirectUploadStagingPrefix,
    isOwnedDirectUploadReference,
    type DirectUploadIntent,
    type DirectUploadIntentInput,
    type DirectUploadReference,
} from "./direct-upload";

export async function createDirectUploadIntent(input: DirectUploadIntentInput): Promise<DirectUploadIntent> {
    const context = await requireAdmin();
    const parsedInput = directUploadIntentInputDto.parse(input);
    const validationMessage = validateContentUploadFile(
        {
            name: parsedInput.fileName,
            size: parsedInput.sizeBytes,
            type: parsedInput.mimeType,
        },
        parsedInput.purpose,
    );

    if (validationMessage) {
        throw new AppError(validationMessage, 400, "INVALID_DIRECT_UPLOAD_FILE");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        throw new Error("Configuration Supabase manquante.");
    }

    const bucket = getDirectUploadBucket(parsedInput.purpose);
    const path = [
        getDirectUploadStagingPrefix(context.userId, parsedInput.purpose).replace(/\/$/, ""),
        randomUUID(),
        sanitizeUploadFileName(parsedInput.fileName, parsedInput.mimeType),
    ].join("/");
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.storage.from(bucket).createSignedUploadUrl(path, {
        upsert: false,
    });

    if (error || !data?.token) {
        throw error ?? new Error("Le jeton d'upload est introuvable.");
    }

    return {
        bucket,
        endpoint: buildDirectStorageEndpoint(supabaseUrl),
        path,
        purpose: parsedInput.purpose,
        token: data.token,
    };
}

export async function cleanupOwnedDirectUploads(references: DirectUploadReference[]) {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const pathsByBucket = new Map<string, string[]>();

    for (const reference of references) {
        if (!isOwnedDirectUploadReference(reference, context.userId)) {
            throw new AppError("Référence d'upload invalide.", 400, "INVALID_DIRECT_UPLOAD_REFERENCE");
        }

        const paths = pathsByBucket.get(reference.bucket) ?? [];
        paths.push(reference.path);
        pathsByBucket.set(reference.bucket, paths);
    }

    for (const [bucket, paths] of pathsByBucket.entries()) {
        const { error } = await adminSupabase.storage.from(bucket).remove(paths);
        if (error) throw error;
    }
}

export async function materializeDirectUpload({
    destinationPath,
    expectedPurpose,
    reference,
    supabase,
    userId,
}: {
    destinationPath: string;
    expectedPurpose: DirectContentUploadPurpose;
    reference: DirectUploadReference;
    supabase: SupabaseClient;
    userId: string;
}) {
    if (!isOwnedDirectUploadReference(reference, userId, expectedPurpose)) {
        throw new AppError("Référence d'upload invalide.", 400, "INVALID_DIRECT_UPLOAD_REFERENCE");
    }

    const bucket = supabase.storage.from(reference.bucket);
    const { data: fileInfo, error: fileInfoError } = await bucket.info(reference.path);
    if (fileInfoError || !fileInfo) {
        throw new AppError(
            "Le fichier uploadé est introuvable.",
            400,
            "DIRECT_UPLOAD_FILE_MISSING",
        );
    }

    const validationMessage = validateContentUploadFile(
        {
            name: getStoragePathFileName(reference.path),
            size: fileInfo.size ?? 0,
            type: fileInfo.contentType ?? "",
        },
        expectedPurpose,
    );
    if (validationMessage) {
        throw new AppError(validationMessage, 400, "INVALID_DIRECT_UPLOAD_FILE");
    }

    const { error } = await bucket.move(reference.path, destinationPath);
    if (error) {
        throw new AppError(
            "Le fichier uploadé est introuvable ou n'a pas pu être finalisé.",
            400,
            "DIRECT_UPLOAD_MATERIALIZATION_FAILED",
        );
    }

    return {
        bucket: reference.bucket,
        path: destinationPath,
    };
}
