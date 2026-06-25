import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import {
    createScenarioQuizRows,
    createScenarioResourceRows,
    SCENARIO_RESOURCE_SELECT,
} from "./roleplay.persistence";
import {
    cleanupUploadedRoleplayStorageObjects,
    materializeScenarioResourceUploads,
    type RoleplayUploadFilesByClientId,
    type UploadedRoleplayStorageObject,
} from "./roleplay-upload-files";

interface ScenarioResourceRow {
    bucket: string | null;
    external_url: string | null;
    id: string;
    is_active: boolean | null;
    label: string | null;
    path: string | null;
    resource_type: string | null;
    scenario_id: string;
    sort_order: number | null;
}

type ScenarioResourceMutationRow = ReturnType<typeof createScenarioResourceRows>[number];

function getStorageLocation(resource: Pick<ScenarioResourceRow, "bucket" | "path">) {
    if (!resource.bucket || !resource.path) return null;

    return {
        bucket: resource.bucket,
        path: resource.path,
    };
}

function getStorageLocationKey(resource: Pick<ScenarioResourceRow, "bucket" | "path">) {
    const location = getStorageLocation(resource);

    return location ? `${location.bucket}:${location.path}` : null;
}

async function saveScenarioQuizzes(
    supabase: SupabaseClient,
    scenarioId: string,
    input: SaveRoleplayDto,
) {
    const { error: deleteError } = await supabase
        .from("scenario_quizzes")
        .delete()
        .eq("scenario_id", scenarioId);

    if (deleteError) {
        throw deleteError;
    }

    const quizRows = createScenarioQuizRows(scenarioId, input);

    if (quizRows.length === 0) {
        return;
    }

    const { error: insertError } = await supabase.from("scenario_quizzes").insert(quizRows);

    if (insertError) {
        throw insertError;
    }
}

async function cleanupStaleScenarioResourceFiles(
    supabase: SupabaseClient,
    existingResources: ScenarioResourceRow[],
    savedResources: ScenarioResourceRow[],
) {
    const savedLocationKeys = new Set(
        savedResources
            .map(getStorageLocationKey)
            .filter((key): key is string => Boolean(key)),
    );
    const staleObjects: UploadedRoleplayStorageObject[] = [];

    for (const resource of existingResources) {
        const location = getStorageLocation(resource);
        const locationKey = getStorageLocationKey(resource);
        if (!location || !locationKey || savedLocationKeys.has(locationKey)) continue;

        staleObjects.push(location);
    }

    if (staleObjects.length > 0) {
        await cleanupUploadedRoleplayStorageObjects(supabase, staleObjects);
    }
}

async function saveScenarioResources(
    supabase: SupabaseClient,
    scenarioId: string,
    input: SaveRoleplayDto,
) {
    const { data: currentResources, error: currentResourcesError } = await supabase
        .from("scenario_resources")
        .select(SCENARIO_RESOURCE_SELECT)
        .eq("scenario_id", scenarioId)
        .order("sort_order", { ascending: true })
        .returns<ScenarioResourceRow[]>();

    if (currentResourcesError) {
        throw currentResourcesError;
    }

    const existingResources = currentResources ?? [];
    const existingResourcesById = new Map(existingResources.map((resource) => [resource.id, resource]));
    const resourceRowsToSave = createScenarioResourceRows(scenarioId, input) as ScenarioResourceMutationRow[];
    const retainedResourceIds = new Set<string>();
    const savedResources: ScenarioResourceRow[] = [];

    for (const resourceRow of resourceRowsToSave) {
        const existingResource = resourceRow.id ? existingResourcesById.get(resourceRow.id) : undefined;

        if (existingResource) {
            const resourceUpdate = { ...resourceRow };
            delete resourceUpdate.id;
            const { data, error } = await supabase
                .from("scenario_resources")
                .update(resourceUpdate)
                .eq("id", existingResource.id)
                .select(SCENARIO_RESOURCE_SELECT)
                .single<ScenarioResourceRow>();

            if (error) {
                throw error;
            }

            retainedResourceIds.add(existingResource.id);
            savedResources.push(data);
            continue;
        }

        const { data, error } = await supabase
            .from("scenario_resources")
            .insert(resourceRow)
            .select(SCENARIO_RESOURCE_SELECT)
            .single<ScenarioResourceRow>();

        if (error) {
            throw error;
        }

        retainedResourceIds.add(data.id);
        savedResources.push(data);
    }

    const resourceIdsToDelete = existingResources
        .filter((resource) => !retainedResourceIds.has(resource.id))
        .map((resource) => resource.id);

    if (resourceIdsToDelete.length > 0) {
        const { error } = await supabase
            .from("scenario_resources")
            .delete()
            .in("id", resourceIdsToDelete);

        if (error) {
            throw error;
        }
    }

    await cleanupStaleScenarioResourceFiles(supabase, existingResources, savedResources);
}

export async function saveRoleplayChildren(
    supabase: SupabaseClient,
    scenarioId: string,
    input: SaveRoleplayDto,
    uploadFilesByClientId: RoleplayUploadFilesByClientId = new Map(),
    uploadedObjects: UploadedRoleplayStorageObject[] = [],
) {
    const materializedInput = await materializeScenarioResourceUploads(
        supabase,
        scenarioId,
        input,
        uploadFilesByClientId,
        uploadedObjects,
    );

    await saveScenarioQuizzes(supabase, scenarioId, materializedInput);
    await saveScenarioResources(supabase, scenarioId, materializedInput);
}
