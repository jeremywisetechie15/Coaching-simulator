import type { SupabaseClient } from "@supabase/supabase-js";
import type { MethodResourceRow } from "./method.mapper";
import { cleanupUploadedStorageObjects, type UploadedStorageObject } from "./method-upload-files";

interface StoredResourceReference extends UploadedStorageObject {
    id: string;
    notationFileId: string | null;
    stepId: string | null;
}

function toStoredResourceReference(resource: MethodResourceRow): StoredResourceReference | null {
    if (!resource.bucket || !resource.path) {
        return null;
    }

    return {
        bucket: resource.bucket,
        id: resource.id,
        notationFileId: resource.notation_file_id ?? null,
        path: resource.path,
        stepId: resource.step_id ?? null,
    };
}

function getStorageLocationKey(location: UploadedStorageObject) {
    return `${location.bucket}:${location.path}`;
}

export function getStaleStoredResourceReferences(
    previousResources: MethodResourceRow[],
    currentResources: MethodResourceRow[],
) {
    const currentLocationKeys = new Set(
        currentResources
            .map(toStoredResourceReference)
            .filter((reference): reference is StoredResourceReference => Boolean(reference))
            .map(getStorageLocationKey),
    );

    return previousResources
        .map(toStoredResourceReference)
        .filter((reference): reference is StoredResourceReference => Boolean(reference))
        .filter((reference) => !currentLocationKeys.has(getStorageLocationKey(reference)));
}

async function hasLocationReference(
    supabase: SupabaseClient,
    table: "method_resources" | "notation_method_files",
    location: UploadedStorageObject,
) {
    const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq("bucket", location.bucket)
        .eq("path", location.path)
        .limit(1);

    if (error) {
        throw error;
    }

    return (data ?? []).length > 0;
}

async function hasNotationFileReference(supabase: SupabaseClient, notationFileId: string) {
    const { data, error } = await supabase
        .from("method_resources")
        .select("id")
        .eq("notation_file_id", notationFileId)
        .limit(1);

    if (error) {
        throw error;
    }

    return (data ?? []).length > 0;
}

async function deleteUnusedNotationFile(
    supabase: SupabaseClient,
    reference: StoredResourceReference,
) {
    if (reference.stepId || !reference.notationFileId) {
        return;
    }

    if (await hasNotationFileReference(supabase, reference.notationFileId)) {
        return;
    }

    const { error } = await supabase
        .from("notation_method_files")
        .delete()
        .eq("id", reference.notationFileId);

    if (error) {
        throw error;
    }
}

export async function cleanupStaleMethodResourceFiles(
    supabase: SupabaseClient,
    previousResources: MethodResourceRow[],
    currentResources: MethodResourceRow[],
) {
    const staleReferences = getStaleStoredResourceReferences(previousResources, currentResources);
    if (staleReferences.length === 0) {
        return;
    }

    try {
        for (const reference of staleReferences) {
            await deleteUnusedNotationFile(supabase, reference);
        }

        const uniqueStaleLocations = Array.from(
            new Map(
                staleReferences.map((reference) => [getStorageLocationKey(reference), reference]),
            ).values(),
        );
        const storageObjectsToDelete: UploadedStorageObject[] = [];

        for (const location of uniqueStaleLocations) {
            const hasMethodResource = await hasLocationReference(supabase, "method_resources", location);
            if (hasMethodResource) continue;

            const hasNotationFile = await hasLocationReference(supabase, "notation_method_files", location);
            if (hasNotationFile) continue;

            storageObjectsToDelete.push({
                bucket: location.bucket,
                path: location.path,
            });
        }

        if (storageObjectsToDelete.length > 0) {
            await cleanupUploadedStorageObjects(supabase, storageObjectsToDelete);
        }
    } catch (error) {
        console.warn("Impossible de nettoyer les anciens fichiers de méthode.", error);
    }
}
