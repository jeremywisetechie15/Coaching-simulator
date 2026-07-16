"use client";

import {
    applyDirectUploadReferences,
    DIRECT_UPLOAD_API_PATH,
    type DirectUploadIntent,
    type DirectUploadProgressHandler,
    type DirectUploadReference,
    type PendingDirectUpload,
} from "./direct-upload";
import {
    CONTENT_UPLOAD_ERROR_MESSAGES,
    CONTENT_UPLOAD_PURPOSES,
    getContentUploadSizeErrorMessage,
} from "./content-upload";

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

interface StorageUploadErrorPayload {
    code?: string;
    error?: string;
    message?: string;
    statusCode?: number | string;
}

function getStorageUploadErrorMessage(
    status: number,
    responseText: string,
    upload: PendingDirectUpload,
) {
    const payload = (() => {
        try {
            return JSON.parse(responseText) as StorageUploadErrorPayload;
        } catch {
            return null;
        }
    })();
    const detail = payload?.message || payload?.error;
    const normalizedCode = payload?.code?.toLowerCase() ?? "";
    const normalizedDetail = detail?.toLowerCase() ?? "";
    const isTooLarge =
        status === 413 ||
        normalizedCode === "entitytoolarge" ||
        normalizedDetail.includes("maximum allowed size") ||
        normalizedDetail.includes("too large");

    if (isTooLarge) {
        return getContentUploadSizeErrorMessage(upload.file, upload.purpose);
    }

    if (status === 401 || status === 403 || String(payload?.statusCode) === "403") {
        return CONTENT_UPLOAD_ERROR_MESSAGES.forbidden;
    }

    if (normalizedCode === "invalidmimetype" || normalizedDetail.includes("mime type")) {
        return CONTENT_UPLOAD_ERROR_MESSAGES.invalidType;
    }

    if (normalizedCode === "nosuchbucket" || normalizedDetail.includes("bucket not found")) {
        return CONTENT_UPLOAD_ERROR_MESSAGES.storageNotConfigured;
    }

    if (
        status === 402 ||
        normalizedCode.includes("quota") ||
        normalizedDetail.includes("quota") ||
        normalizedDetail.includes("storage limit")
    ) {
        return CONTENT_UPLOAD_ERROR_MESSAGES.storageFull;
    }

    if (status >= 500) {
        return CONTENT_UPLOAD_ERROR_MESSAGES.unavailable;
    }

    return CONTENT_UPLOAD_ERROR_MESSAGES.unknown;
}

export function uploadFileToSignedUrl(
    upload: PendingDirectUpload,
    intent: DirectUploadIntent,
    onProgress?: DirectUploadProgressHandler,
) {
    return new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", intent.signedUrl);
        request.setRequestHeader(
            "cache-control",
            upload.purpose === CONTENT_UPLOAD_PURPOSES.personaCv
                ? "no-store, max-age=0"
                : "max-age=3600",
        );
        request.setRequestHeader("content-type", upload.file.type || "application/octet-stream");
        request.setRequestHeader("x-upsert", "false");
        request.upload.onprogress = (event) => {
            if (!event.lengthComputable || event.total <= 0) return;

            onProgress?.(upload.clientFileId, Math.round((event.loaded / event.total) * 100));
        };
        request.onerror = () => reject(new Error(CONTENT_UPLOAD_ERROR_MESSAGES.network));
        request.onabort = () => reject(new Error("L'upload du fichier a été annulé."));
        request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
                onProgress?.(upload.clientFileId, 100);
                resolve();
                return;
            }

            reject(new Error(getStorageUploadErrorMessage(request.status, request.responseText, upload)));
        };
        request.send(upload.file);
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
            await uploadFileToSignedUrl(upload, intent, onProgress);
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
