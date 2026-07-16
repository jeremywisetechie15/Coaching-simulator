"use client";

import { Upload } from "tus-js-client";
import {
    applyDirectUploadReferences,
    DIRECT_UPLOAD_API_PATH,
    DIRECT_UPLOAD_TUS_CHUNK_SIZE_BYTES,
    type DirectUploadIntent,
    type DirectUploadProgressHandler,
    type DirectUploadReference,
    type PendingDirectUpload,
} from "./direct-upload";
import { CONTENT_UPLOAD_PURPOSES } from "./content-upload";

interface DirectUploadApiPayload {
    error?: string;
    intent?: DirectUploadIntent;
}

async function requestDirectUploadIntent(upload: PendingDirectUpload) {
    const response = await fetch(DIRECT_UPLOAD_API_PATH, {
        body: JSON.stringify({
            fileName: upload.file.name,
            mimeType: upload.file.type,
            purpose: upload.purpose,
            sizeBytes: upload.file.size,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as DirectUploadApiPayload | null;

    if (!response.ok || !payload?.intent) {
        throw new Error(payload?.error || "Impossible de préparer l'upload du fichier.");
    }

    return payload.intent;
}

function uploadFileWithTus(
    upload: PendingDirectUpload,
    intent: DirectUploadIntent,
    onProgress?: DirectUploadProgressHandler,
) {
    return new Promise<void>((resolve, reject) => {
        const tusUpload = new Upload(upload.file, {
            chunkSize: DIRECT_UPLOAD_TUS_CHUNK_SIZE_BYTES,
            endpoint: intent.endpoint,
            headers: {
                "x-signature": intent.token,
            },
            metadata: {
                bucketName: intent.bucket,
                cacheControl: upload.purpose === CONTENT_UPLOAD_PURPOSES.personaCv ? "0" : "3600",
                contentType: upload.file.type,
                objectName: intent.path,
            },
            onError: reject,
            onProgress: (bytesUploaded, bytesTotal) => {
                const percentage = bytesTotal > 0 ? Math.round((bytesUploaded / bytesTotal) * 100) : 0;
                onProgress?.(upload.clientFileId, percentage);
            },
            onSuccess: () => {
                onProgress?.(upload.clientFileId, 100);
                resolve();
            },
            removeFingerprintOnSuccess: true,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            uploadDataDuringCreation: true,
        });

        tusUpload.start();
    });
}

export async function cleanupDirectUploadReferences(references: DirectUploadReference[]) {
    if (references.length === 0) return;

    await fetch(DIRECT_UPLOAD_API_PATH, {
        body: JSON.stringify({ references }),
        headers: { "Content-Type": "application/json" },
        method: "DELETE",
    }).catch(() => undefined);
}

export async function uploadFilesDirectly(
    uploads: PendingDirectUpload[],
    onProgress?: DirectUploadProgressHandler,
) {
    const referencesByClientFileId = new Map<string, DirectUploadReference>();
    const issuedReferences: DirectUploadReference[] = [];

    try {
        for (const upload of uploads) {
            const intent = await requestDirectUploadIntent(upload);
            const reference: DirectUploadReference = {
                bucket: intent.bucket,
                path: intent.path,
                purpose: intent.purpose,
            };
            issuedReferences.push(reference);
            onProgress?.(upload.clientFileId, 0);
            await uploadFileWithTus(upload, intent, onProgress);
            referencesByClientFileId.set(upload.clientFileId, reference);
        }
    } catch (error) {
        await cleanupDirectUploadReferences(issuedReferences);
        throw error;
    }

    return referencesByClientFileId;
}

export async function submitWithDirectUploads<TPayload, TResult>({
    onProgress,
    payload,
    save,
    uploads,
}: {
    onProgress?: DirectUploadProgressHandler;
    payload: TPayload;
    save: (payload: TPayload) => Promise<TResult>;
    uploads: PendingDirectUpload[];
}) {
    if (uploads.length === 0) {
        return save(payload);
    }

    const referencesByClientFileId = await uploadFilesDirectly(uploads, onProgress);
    const references = Array.from(referencesByClientFileId.values());

    try {
        return await save(applyDirectUploadReferences(payload, referencesByClientFileId));
    } catch (error) {
        await cleanupDirectUploadReferences(references);
        throw error;
    }
}
