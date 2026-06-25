import { requireAdmin } from "@/features/auth/server";
import type { MethodDetail } from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapMethodRowsToDetail,
    type MethodResourceRow,
    type MethodRow,
    type MethodStepRow,
} from "./method.mapper";
import { syncMethodNotationFiles } from "./method-notation-files";
import { withMethodOrganizationNames } from "./method-organization-names";
import { cleanupStaleMethodResourceFiles } from "./method-resource-cleanup";
import {
    createMethodUpdate,
    createResourceRows,
    createStepRows,
    METHOD_RESOURCE_SELECT,
    METHOD_SELECT,
    METHOD_STEP_SELECT,
} from "./method.persistence";
import { normalizeMethodScopeForWrite } from "./normalize-method-scope";
import {
    cleanupUploadedStorageObjects,
    materializeMethodResourceUploads,
    type MethodUploadFilesByClientId,
    type UploadedStorageObject,
} from "./method-upload-files";

type StepMutationRow = ReturnType<typeof createStepRows>[number];
type ResourceMutationRow = ReturnType<typeof createResourceRows>[number] & { id?: string };

function findExistingStep(
    row: StepMutationRow,
    inputStep: SaveMethodDto["steps"][number],
    existingById: Map<string, MethodStepRow>,
    existingByKey: Map<string, MethodStepRow>,
    existingByOrder: Map<number, MethodStepRow>,
) {
    if (inputStep.id && existingById.has(inputStep.id)) {
        return existingById.get(inputStep.id);
    }

    if (row.step_key && existingByKey.has(row.step_key)) {
        return existingByKey.get(row.step_key);
    }

    return existingByOrder.get(row.step_order);
}

export async function updateMethod(
    methodId: string,
    input: SaveMethodDto,
    uploadFilesByClientId: MethodUploadFilesByClientId = new Map(),
): Promise<MethodDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const normalizedInput = normalizeMethodScopeForWrite(context, input);

    const { data: existingMethod, error: existingError } = await adminSupabase
        .from("methods")
        .select("id")
        .eq("id", methodId)
        .maybeSingle<{ id: string }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingMethod) {
        throw new NotFoundError("Méthode introuvable.");
    }

    const { data: currentSteps, error: currentStepsError } = await adminSupabase
        .from("method_steps")
        .select(METHOD_STEP_SELECT)
        .eq("method_id", methodId)
        .order("step_order", { ascending: true });

    if (currentStepsError) {
        throw currentStepsError;
    }

    const existingSteps = (currentSteps ?? []) as MethodStepRow[];
    const existingStepsById = new Map(existingSteps.map((step) => [step.id, step]));
    const existingStepsByOrder = new Map(existingSteps.map((step) => [step.step_order, step]));
    const existingStepsByKey = new Map(
        existingSteps
            .filter((step): step is MethodStepRow & { step_key: string } => Boolean(step.step_key))
            .map((step) => [step.step_key, step]),
    );

    const { data: methodRow, error: methodError } = await adminSupabase
        .from("methods")
        .update(createMethodUpdate(normalizedInput))
        .eq("id", methodId)
        .select(METHOD_SELECT)
        .single<MethodRow>();

    if (methodError) {
        throw methodError;
    }

    const savedSteps: MethodStepRow[] = [];
    const retainedStepIds = new Set<string>();
    const stepRowsToSave = createStepRows(methodId, normalizedInput);

    for (const [index, stepRow] of stepRowsToSave.entries()) {
        const existingStep = findExistingStep(
            stepRow,
            normalizedInput.steps[index],
            existingStepsById,
            existingStepsByKey,
            existingStepsByOrder,
        );

        if (existingStep) {
            const { data, error } = await adminSupabase
                .from("method_steps")
                .update({
                    ...stepRow,
                    code: stepRow.code ?? existingStep.code ?? null,
                    weight: existingStep.weight ?? stepRow.weight,
                })
                .eq("id", existingStep.id)
                .select(METHOD_STEP_SELECT)
                .single<MethodStepRow>();

            if (error) {
                throw error;
            }

            retainedStepIds.add(existingStep.id);
            savedSteps.push(data);
            continue;
        }

        const { data, error } = await adminSupabase
            .from("method_steps")
            .insert(stepRow)
            .select(METHOD_STEP_SELECT)
            .single<MethodStepRow>();

        if (error) {
            throw error;
        }

        retainedStepIds.add(data.id);
        savedSteps.push(data);
    }

    const stepIdsToDelete = existingSteps
        .filter((step) => !retainedStepIds.has(step.id))
        .map((step) => step.id);

    if (stepIdsToDelete.length > 0) {
        const { error } = await adminSupabase
            .from("method_steps")
            .delete()
            .in("id", stepIdsToDelete);

        if (error) {
            throw error;
        }
    }

    const sortedSavedSteps = savedSteps.slice().sort((a, b) => a.step_order - b.step_order);
    const stepIdsByOrder = new Map(sortedSavedSteps.map((step) => [step.step_order, step.id]));
    const uploadedObjects: UploadedStorageObject[] = [];
    let materializedInput: SaveMethodDto;

    try {
        materializedInput = await materializeMethodResourceUploads(
            adminSupabase,
            methodId,
            normalizedInput,
            stepIdsByOrder,
            uploadFilesByClientId,
            uploadedObjects,
        );
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }

    const { data: currentResources, error: currentResourcesError } = await adminSupabase
        .from("method_resources")
        .select(METHOD_RESOURCE_SELECT)
        .eq("method_id", methodId)
        .order("sort_order", { ascending: true });

    if (currentResourcesError) {
        throw currentResourcesError;
    }

    const existingResources = (currentResources ?? []) as MethodResourceRow[];
    const existingResourcesById = new Map(existingResources.map((resource) => [resource.id, resource]));
    const resourceRowsToSave = createResourceRows(methodId, materializedInput, stepIdsByOrder) as ResourceMutationRow[];
    let resourceRows: MethodResourceRow[] = [];
    const retainedResourceIds = new Set<string>();

    for (const resourceRow of resourceRowsToSave) {
        const existingResource = resourceRow.id ? existingResourcesById.get(resourceRow.id) : undefined;

        if (existingResource) {
            const resourceUpdate = { ...resourceRow, notation_file_id: null };
            delete resourceUpdate.id;
            const { data, error } = await adminSupabase
                .from("method_resources")
                .update(resourceUpdate)
                .eq("id", existingResource.id)
                .select(METHOD_RESOURCE_SELECT)
                .single<MethodResourceRow>();

            if (error) {
                throw error;
            }

            retainedResourceIds.add(existingResource.id);
            resourceRows.push(data);
            continue;
        }

        const { data, error } = await adminSupabase
            .from("method_resources")
            .insert(resourceRow)
            .select(METHOD_RESOURCE_SELECT)
            .single<MethodResourceRow>();

        if (error) {
            throw error;
        }

        retainedResourceIds.add(data.id);
        resourceRows.push(data);
    }

    const resourceIdsToDelete = existingResources
        .filter((resource) => !retainedResourceIds.has(resource.id))
        .map((resource) => resource.id);

    if (resourceIdsToDelete.length > 0) {
        const { error } = await adminSupabase
            .from("method_resources")
            .delete()
            .in("id", resourceIdsToDelete);

        if (error) {
            throw error;
        }
    }

    resourceRows = resourceRows.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    if (resourceRows.length > 0) {
        const synced = await syncMethodNotationFiles(adminSupabase, methodRow, resourceRows);
        resourceRows = synced.resources;
    }

    await cleanupStaleMethodResourceFiles(adminSupabase, existingResources, resourceRows);

    const [methodWithOrganizationName] = await withMethodOrganizationNames([methodRow]);

    return mapMethodRowsToDetail(methodWithOrganizationName, sortedSavedSteps, resourceRows);
}
