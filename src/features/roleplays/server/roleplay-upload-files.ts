import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import {
    CONTENT_UPLOAD_PURPOSES,
    SCENARIO_RESOURCE_UPLOAD_BUCKET,
    getStoragePathFileName,
    inferContentUploadResourceType,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { materializeDirectUpload } from "@/lib/uploads/direct-upload.server";
import { fileToStorageUploadBody } from "@/lib/uploads/storage-upload-body";
import { AppError } from "@/lib/server/errors";

export type RoleplayUploadFilesByClientId = Map<string, File>;

export interface UploadedRoleplayStorageObject {
    bucket: string;
    path: string;
}

type RoleplayResourceInput = SaveRoleplayDto["resources"][number];

function buildScenarioResourceUploadPath(
    scenarioId: string,
    resourceId: string,
    fileName: string,
) {
    return ["scenarios", scenarioId, "resources", resourceId, fileName].join("/");
}

async function uploadScenarioResourceFile(
    supabase: SupabaseClient,
    file: File,
    path: string,
) {
    const { error } = await supabase.storage
        .from(SCENARIO_RESOURCE_UPLOAD_BUCKET)
        .upload(path, await fileToStorageUploadBody(file), {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
        });

    if (error) {
        throw error;
    }
}

async function materializeScenarioResourceUpload(
    supabase: SupabaseClient,
    scenarioId: string,
    resource: RoleplayResourceInput,
    uploadFilesByClientId: RoleplayUploadFilesByClientId,
    uploadedObjects: UploadedRoleplayStorageObject[],
    ownerUserId: string | null,
): Promise<RoleplayResourceInput> {
    if (!resource.clientFileId) {
        return resource;
    }

    const resourceId = resource.id ?? randomUUID();
    const file = uploadFilesByClientId.get(resource.clientFileId);
    let fileName: string;
    let resourceType = resource.resourceType;

    if (file) {
        const validationMessage = validateContentUploadFile(file, CONTENT_UPLOAD_PURPOSES.scenarioResource);
        if (validationMessage) {
            throw new AppError(validationMessage, 400, "INVALID_ROLEPLAY_UPLOAD_FILE");
        }

        fileName = sanitizeUploadFileName(file.name, file.type);
        resourceType = inferContentUploadResourceType(file.type);
    } else {
        if (!ownerUserId || !resource.storageBucket || !resource.storagePath) {
            throw new AppError("Le fichier sélectionné est manquant.", 400, "ROLEPLAY_UPLOAD_FILE_MISSING");
        }

        fileName = getStoragePathFileName(resource.storagePath);
    }

    const path = buildScenarioResourceUploadPath(scenarioId, resourceId, fileName);
    if (file) {
        await uploadScenarioResourceFile(supabase, file, path);
    } else {
        if (!ownerUserId) {
            throw new AppError("Propriétaire de l'upload manquant.", 400, "ROLEPLAY_UPLOAD_OWNER_MISSING");
        }
        await materializeDirectUpload({
            destinationPath: path,
            expectedPurpose: CONTENT_UPLOAD_PURPOSES.scenarioResource,
            reference: {
                bucket: resource.storageBucket,
                path: resource.storagePath,
                purpose: CONTENT_UPLOAD_PURPOSES.scenarioResource,
            },
            supabase,
            userId: ownerUserId,
        });
    }
    uploadedObjects.push({ bucket: SCENARIO_RESOURCE_UPLOAD_BUCKET, path });

    return {
        ...resource,
        clientFileId: "",
        externalUrl: "",
        id: resourceId,
        label: resource.label || file?.name || fileName,
        resourceType,
        storageBucket: SCENARIO_RESOURCE_UPLOAD_BUCKET,
        storagePath: path,
    };
}

export async function materializeScenarioResourceUploads(
    supabase: SupabaseClient,
    scenarioId: string,
    input: SaveRoleplayDto,
    uploadFilesByClientId: RoleplayUploadFilesByClientId,
    uploadedObjects: UploadedRoleplayStorageObject[],
    ownerUserId: string | null = null,
): Promise<SaveRoleplayDto> {
    if (uploadFilesByClientId.size === 0 && !input.resources.some((resource) => resource.clientFileId)) {
        return input;
    }

    const resources: SaveRoleplayDto["resources"] = [];

    for (const resource of input.resources) {
        resources.push(
            await materializeScenarioResourceUpload(
                supabase,
                scenarioId,
                resource,
                uploadFilesByClientId,
                uploadedObjects,
                ownerUserId,
            ),
        );
    }

    return {
        ...input,
        resources,
    };
}

export async function cleanupUploadedRoleplayStorageObjects(
    supabase: SupabaseClient,
    uploadedObjects: UploadedRoleplayStorageObject[],
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
            console.warn("Impossible de nettoyer les fichiers roleplay uploadés.", error);
        }
    }
}
