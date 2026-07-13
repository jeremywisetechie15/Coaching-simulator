import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import {
    CONTENT_UPLOAD_PURPOSES,
    QUIZ_UPLOAD_BUCKET,
    getStoragePathFileName,
    inferContentUploadResourceType,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { materializeDirectUpload } from "@/lib/uploads/direct-upload.server";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";
import { AppError } from "@/lib/server/errors";

export type QuizUploadFilesByClientId = Map<string, File>;

export interface UploadedQuizStorageObject {
    bucket: string;
    path: string;
}

type QuizAttachmentInput = SaveQuizDto["steps"][number]["questions"][number]["attachments"][number];

function inferQuizAttachmentType(mimeType: string): Exclude<QuizAttachmentInput["type"], "link"> {
    const resourceType = inferContentUploadResourceType(mimeType);

    return resourceType === "image" || resourceType === "video" || resourceType === "audio"
        ? resourceType
        : "document";
}

function buildQuizAttachmentUploadPath(
    quizId: string,
    questionId: string,
    attachmentId: string,
    fileName: string,
) {
    return ["quizzes", quizId, "questions", questionId, "attachments", attachmentId, fileName].join("/");
}

async function uploadQuizAttachmentFile(
    supabase: SupabaseClient,
    file: File,
    path: string,
) {
    const { error } = await supabase.storage
        .from(QUIZ_UPLOAD_BUCKET)
        .upload(path, await fileToStorageUploadBody(file), {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        throw error;
    }
}

export async function materializeQuizAttachmentUpload(
    supabase: SupabaseClient,
    quizId: string,
    questionId: string,
    attachment: QuizAttachmentInput,
    uploadFilesByClientId: QuizUploadFilesByClientId,
    uploadedObjects: UploadedQuizStorageObject[],
    ownerUserId: string | null = null,
): Promise<QuizAttachmentInput> {
    if (!attachment.clientFileId) {
        return attachment;
    }

    const attachmentId = attachment.id ?? randomUUID();
    const file = uploadFilesByClientId.get(attachment.clientFileId);
    let fileName: string;
    let attachmentType = attachment.type;

    if (file) {
        const validationMessage = validateContentUploadFile(file, CONTENT_UPLOAD_PURPOSES.quizAttachment);
        if (validationMessage) {
            throw new AppError(validationMessage, 400, "INVALID_QUIZ_UPLOAD_FILE");
        }

        fileName = sanitizeUploadFileName(file.name, file.type);
        attachmentType = inferQuizAttachmentType(file.type);
    } else {
        if (!ownerUserId || !attachment.storageBucket || !attachment.storagePath) {
            throw new AppError("Le fichier sélectionné est manquant.", 400, "QUIZ_UPLOAD_FILE_MISSING");
        }

        fileName = getStoragePathFileName(attachment.storagePath);
    }

    const path = buildQuizAttachmentUploadPath(quizId, questionId, attachmentId, fileName);
    if (file) {
        await uploadQuizAttachmentFile(supabase, file, path);
    } else {
        if (!ownerUserId) {
            throw new AppError("Propriétaire de l'upload manquant.", 400, "QUIZ_UPLOAD_OWNER_MISSING");
        }
        await materializeDirectUpload({
            destinationPath: path,
            expectedPurpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
            reference: {
                bucket: attachment.storageBucket,
                path: attachment.storagePath,
                purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
            },
            supabase,
            userId: ownerUserId,
        });
    }
    uploadedObjects.push({ bucket: QUIZ_UPLOAD_BUCKET, path });

    return {
        ...attachment,
        clientFileId: "",
        externalUrl: "",
        id: attachmentId,
        label: attachment.label || file?.name || fileName,
        storageBucket: QUIZ_UPLOAD_BUCKET,
        storagePath: path,
        type: attachmentType,
    };
}

export async function cleanupUploadedQuizStorageObjects(
    supabase: SupabaseClient,
    uploadedObjects: UploadedQuizStorageObject[],
) {
    const pathsByBucket = uploadedObjects.reduce((accumulator, object) => {
        const paths = accumulator.get(object.bucket) ?? [];
        paths.push(object.path);
        accumulator.set(object.bucket, paths);

        return accumulator;
    }, new Map<string, string[]>());

    for (const [bucket, paths] of pathsByBucket.entries()) {
        const { error } = await supabase.storage.from(bucket).remove(paths);
        if (error) {
            console.warn("Impossible de nettoyer les fichiers quiz uploadés.", error);
        }
    }
}
