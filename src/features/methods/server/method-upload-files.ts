import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import {
    CONTENT_UPLOAD_BUCKET,
    CONTENT_UPLOAD_PURPOSES,
    inferContentUploadResourceType,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
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
    file: File,
    stepId: string | null,
) {
    const sanitizedFileName = sanitizeUploadFileName(file.name, file.type);
    const parts = stepId
        ? ["methods", methodId, "steps", stepId, "resources", resourceId, sanitizedFileName]
        : ["methods", methodId, "resources", resourceId, sanitizedFileName];

    return parts.join("/");
}

async function uploadMethodResourceFile(
    supabase: SupabaseClient,
    file: File,
    path: string,
) {
    const { error } = await supabase.storage
        .from(CONTENT_UPLOAD_BUCKET)
        .upload(path, await file.arrayBuffer(), {
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
): Promise<MethodResourceInput> {
    if (!resource.clientFileId) {
        return resource;
    }

    const file = uploadFilesByClientId.get(resource.clientFileId);
    if (!file) {
        throw new AppError("Le fichier sélectionné est manquant.", 400, "METHOD_UPLOAD_FILE_MISSING");
    }

    const uploadPurpose = stepId
        ? CONTENT_UPLOAD_PURPOSES.contentAsset
        : CONTENT_UPLOAD_PURPOSES.methodDocument;
    const validationMessage = validateContentUploadFile(file, uploadPurpose);
    if (validationMessage) {
        throw new AppError(validationMessage, 400, "INVALID_METHOD_UPLOAD_FILE");
    }

    const resourceId = resource.id ?? randomUUID();
    const path = buildMethodResourceUploadPath(methodId, resourceId, file, stepId);
    await uploadMethodResourceFile(supabase, file, path);
    uploadedObjects.push({ bucket: CONTENT_UPLOAD_BUCKET, path });

    return {
        ...resource,
        clientFileId: "",
        externalUrl: "",
        id: resourceId,
        label: resource.label || file.name,
        resourceType: stepId ? inferContentUploadResourceType(file.type) : "document",
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
): Promise<SaveMethodDto> {
    if (uploadFilesByClientId.size === 0) {
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
