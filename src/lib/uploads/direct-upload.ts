import { z } from "zod";
import {
    DIRECT_CONTENT_UPLOAD_BUCKET_BY_PURPOSE,
    DIRECT_CONTENT_UPLOAD_PURPOSES,
    type DirectContentUploadPurpose,
} from "./content-upload";

export const DIRECT_UPLOAD_API_PATH = "/api/uploads/intents";
export const DIRECT_UPLOAD_STAGING_ROOT = "_staging";
export const DIRECT_UPLOAD_TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

export const directUploadIntentInputDto = z
    .object({
        fileName: z.string().trim().min(1).max(255),
        mimeType: z.string().trim().min(1).max(160),
        purpose: z.enum(DIRECT_CONTENT_UPLOAD_PURPOSES),
        sizeBytes: z.number().int().positive(),
    })
    .strict();

export const directUploadReferenceDto = z
    .object({
        bucket: z.string().trim().min(1).max(120),
        path: z.string().trim().min(1).max(1000),
        purpose: z.enum(DIRECT_CONTENT_UPLOAD_PURPOSES),
    })
    .strict();

export const directUploadCleanupDto = z
    .object({
        references: z.array(directUploadReferenceDto).max(100),
    })
    .strict();

export type DirectUploadIntentInput = z.infer<typeof directUploadIntentInputDto>;
export type DirectUploadReference = z.infer<typeof directUploadReferenceDto>;

export interface DirectUploadIntent extends DirectUploadReference {
    endpoint: string;
    token: string;
}

export interface PendingDirectUpload {
    clientFileId: string;
    file: File;
    purpose: DirectContentUploadPurpose;
}

export type DirectUploadProgressHandler = (clientFileId: string, percentage: number) => void;

export function getDirectUploadBucket(purpose: DirectContentUploadPurpose) {
    return DIRECT_CONTENT_UPLOAD_BUCKET_BY_PURPOSE[purpose];
}

export function getDirectUploadStagingPrefix(userId: string, purpose: DirectContentUploadPurpose) {
    return `${DIRECT_UPLOAD_STAGING_ROOT}/${userId}/${purpose}/`;
}

export function isOwnedDirectUploadReference(
    reference: DirectUploadReference,
    userId: string,
    expectedPurpose: DirectContentUploadPurpose = reference.purpose,
) {
    return (
        reference.purpose === expectedPurpose &&
        reference.bucket === getDirectUploadBucket(expectedPurpose) &&
        reference.path.startsWith(getDirectUploadStagingPrefix(userId, expectedPurpose))
    );
}

export function buildDirectStorageEndpoint(supabaseUrl: string) {
    const url = new URL(supabaseUrl);
    const projectRef = url.hostname.split(".")[0];

    if (!projectRef) {
        throw new Error("URL Supabase invalide pour l'upload direct.");
    }

    return url.hostname.endsWith(".supabase.co")
        ? `${url.protocol}//${projectRef}.storage.supabase.co/storage/v1/upload/resumable`
        : `${url.origin}/storage/v1/upload/resumable`;
}

export function applyDirectUploadReferences<T>(
    value: T,
    referencesByClientFileId: ReadonlyMap<string, DirectUploadReference>,
): T {
    if (Array.isArray(value)) {
        return value.map((item) => applyDirectUploadReferences(item, referencesByClientFileId)) as T;
    }

    if (!value || typeof value !== "object") {
        return value;
    }

    const record = value as Record<string, unknown>;
    const nextRecord = Object.fromEntries(
        Object.entries(record).map(([key, entry]) => [
            key,
            applyDirectUploadReferences(entry, referencesByClientFileId),
        ]),
    );
    const clientFileId = typeof record.clientFileId === "string" ? record.clientFileId : "";
    const reference = clientFileId ? referencesByClientFileId.get(clientFileId) : undefined;

    if (reference) {
        nextRecord.storageBucket = reference.bucket;
        nextRecord.storagePath = reference.path;
    }

    return nextRecord as T;
}
