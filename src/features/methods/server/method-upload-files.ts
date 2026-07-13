import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import {
    CONTENT_UPLOAD_BUCKET,
    CONTENT_UPLOAD_PURPOSES,
    getStoragePathFileName,
    inferContentUploadResourceType,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { materializeDirectUpload } from "@/lib/uploads/direct-upload.server";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";
import { AppError } from "@/lib/server/errors";

export type MethodUploadFilesByClientId = Map<string, File>;

export interface UploadedStorageObject {
    bucket: string;
    path: string;
}

type MethodResourceInput = SaveMethodDto["resources"][number];

function buildMethodResourceUploadPath(
    methodId: string,
    resourceId: string,
    fileName: string,
    stepId: string | null,
) {
    const parts = stepId
        ? ["methods", methodId, "steps", stepId, "resources", resourceId, fileName]
        : ["methods", methodId, "resources", resourceId, fileName];

    return parts.join("/");
}

async function uploadMethodResourceFile(
    supabase: SupabaseClient,
    file: File,
    path: string,
) {
    const { error } = await supabase.storage
        .from(CONTENT_UPLOAD_BUCKET)
        .upload(path, await fileToStorageUploadBody(file), {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        throw error;
    }
}

async function materializeResourceUpload(
    supabase: SupabaseClient,
    methodId: string,
    resource: MethodResourceInput,
    stepId: string | null,
    uploadFilesByClientId: MethodUploadFilesByClientId,
    uploadedObjects: UploadedStorageObject[],
    ownerUserId: string | null,
): Promise<MethodResourceInput> {
    if (!resource.clientFileId) {
        return resource;
    }

    const uploadPurpose = stepId
        ? CONTENT_UPLOAD_PURPOSES.contentAsset
        : CONTENT_UPLOAD_PURPOSES.methodDocument;
    const resourceId = resource.id ?? randomUUID();
    const file = uploadFilesByClientId.get(resource.clientFileId);
    let fileName: string;
    let resourceType = resource.resourceType;

    if (file) {
        const validationMessage = validateContentUploadFile(file, uploadPurpose);
        if (validationMessage) {
            throw new AppError(validationMessage, 400, "INVALID_METHOD_UPLOAD_FILE");
        }

        fileName = sanitizeUploadFileName(file.name, file.type);
        resourceType = stepId ? inferContentUploadResourceType(file.type) : "document";
    } else {
        if (!ownerUserId || !resource.storageBucket || !resource.storagePath) {
            throw new AppError("Le fichier sélectionné est manquant.", 400, "METHOD_UPLOAD_FILE_MISSING");
        }

        fileName = getStoragePathFileName(resource.storagePath);
    }

    const path = buildMethodResourceUploadPath(methodId, resourceId, fileName, stepId);
    if (file) {
        await uploadMethodResourceFile(supabase, file, path);
    } else {
        if (!ownerUserId) {
            throw new AppError("Propriétaire de l'upload manquant.", 400, "METHOD_UPLOAD_OWNER_MISSING");
        }
        await materializeDirectUpload({
            destinationPath: path,
            expectedPurpose: uploadPurpose,
            reference: {
                bucket: resource.storageBucket,
                path: resource.storagePath,
                purpose: uploadPurpose,
            },
            supabase,
            userId: ownerUserId,
        });
    }
    uploadedObjects.push({ bucket: CONTENT_UPLOAD_BUCKET, path });

    return {
        ...resource,
        clientFileId: "",
        externalUrl: "",
        id: resourceId,
        label: resource.label || file?.name || fileName,
        resourceType,
        storageBucket: CONTENT_UPLOAD_BUCKET,
        storagePath: path,
    };
}

export async function materializeMethodResourceUploads(
    supabase: SupabaseClient,
    methodId: string,
    input: SaveMethodDto,
    stepIdsByOrder: Map<number, string>,
    uploadFilesByClientId: MethodUploadFilesByClientId,
    uploadedObjects: UploadedStorageObject[],
    ownerUserId: string | null = null,
): Promise<SaveMethodDto> {
    const hasPendingDirectUpload = [
        ...input.resources,
        ...input.steps.flatMap((step) => step.resources),
    ].some((resource) => Boolean(resource.clientFileId));

    if (uploadFilesByClientId.size === 0 && !hasPendingDirectUpload) {
        return input;
    }

    const resources: SaveMethodDto["resources"] = [];
    for (const resource of input.resources) {
        resources.push(
            await materializeResourceUpload(
                supabase,
                methodId,
                resource,
                null,
                uploadFilesByClientId,
                uploadedObjects,
                ownerUserId,
            ),
        );
    }

    const steps: SaveMethodDto["steps"] = [];
    for (const [index, step] of input.steps.entries()) {
        const stepId = stepIdsByOrder.get(index + 1) ?? null;
        const stepResources: SaveMethodDto["steps"][number]["resources"] = [];

        for (const resource of step.resources) {
            stepResources.push(
                await materializeResourceUpload(
                    supabase,
                    methodId,
                    resource,
                    stepId,
                    uploadFilesByClientId,
                    uploadedObjects,
                    ownerUserId,
                ),
            );
        }

        steps.push({
            ...step,
            resources: stepResources,
        });
    }

    return {
        ...input,
        resources,
        steps,
    };
}

export async function cleanupUploadedStorageObjects(
    supabase: SupabaseClient,
    uploadedObjects: UploadedStorageObject[],
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
            console.warn("Impossible de nettoyer les fichiers uploadés.", error);
        }
    }
}
