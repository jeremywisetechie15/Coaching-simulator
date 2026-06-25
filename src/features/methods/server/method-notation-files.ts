import type { SupabaseClient } from "@supabase/supabase-js";
import type { MethodResourceRow, MethodRow } from "./method.mapper";

interface NotationFileRow {
    bucket: string;
    id: string;
    path: string;
}

function isNotationDocumentResource(resource: MethodResourceRow) {
    return Boolean(!resource.step_id && resource.bucket && resource.path);
}

function getFileType(path: string, resourceType: string | null | undefined) {
    const extension = path.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    return extension || resourceType || "pdf";
}

async function ensureNotationMethodForMethod(
    supabase: SupabaseClient,
    method: MethodRow,
) {
    if (method.notation_method_id) {
        return method.notation_method_id;
    }

    const now = new Date().toISOString();
    const notationMethodId = method.id;
    const { error: notationMethodError } = await supabase
        .from("notation_methods")
        .upsert(
            {
                code: method.code || method.id,
                description: method.description ?? null,
                id: notationMethodId,
                is_active: method.is_active ?? true,
                is_default: false,
                name: method.name,
                status: method.status ?? "draft",
                updated_at: now,
                version: method.version ?? "v1",
            },
            { onConflict: "id" },
        );

    if (notationMethodError) {
        throw notationMethodError;
    }

    const { error: methodError } = await supabase
        .from("methods")
        .update({ notation_method_id: notationMethodId })
        .eq("id", method.id);

    if (methodError) {
        throw methodError;
    }

    method.notation_method_id = notationMethodId;
    return notationMethodId;
}

export async function syncMethodNotationFiles(
    supabase: SupabaseClient,
    method: MethodRow,
    resources: MethodResourceRow[],
) {
    const documentResources = resources.filter(isNotationDocumentResource);

    if (documentResources.length === 0) {
        return { method, resources };
    }

    const notationMethodId = await ensureNotationMethodForMethod(supabase, method);
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from("notation_method_files")
        .upsert(
            documentResources.map((resource, index) => ({
                bucket: resource.bucket,
                file_type: getFileType(resource.path ?? "", resource.resource_type),
                is_active: true,
                label: resource.label ?? resource.path,
                method_id: notationMethodId,
                path: resource.path,
                sort_order: resource.sort_order ?? index + 1,
                updated_at: now,
            })),
            { onConflict: "method_id,bucket,path" },
        )
        .select("id, bucket, path");

    if (error) {
        throw error;
    }

    const notationFileIdByLocation = new Map(
        ((data ?? []) as NotationFileRow[]).map((file) => [`${file.bucket}:${file.path}`, file.id]),
    );

    const updatedResources = [...resources];

    for (const resource of documentResources) {
        const notationFileId = notationFileIdByLocation.get(`${resource.bucket}:${resource.path}`);
        if (!notationFileId) continue;

        const { error: resourceError } = await supabase
            .from("method_resources")
            .update({ notation_file_id: notationFileId })
            .eq("id", resource.id);

        if (resourceError) {
            throw resourceError;
        }

        const resourceIndex = updatedResources.findIndex((candidate) => candidate.id === resource.id);
        if (resourceIndex >= 0) {
            updatedResources[resourceIndex] = {
                ...updatedResources[resourceIndex],
                notation_file_id: notationFileId,
            };
        }
    }

    return {
        method,
        resources: updatedResources,
    };
}
