import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server";
import type { MethodDetail } from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { mapDatabaseError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapMethodRowsToDetail,
    type MethodResourceRow,
    type MethodRow,
    type MethodStepRow,
} from "./method.mapper";
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
import { assertMethodLifecycle } from "./assert-method-lifecycle";

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
        .select("id, status")
        .eq("id", methodId)
        .maybeSingle<{ id: string; status: SaveMethodDto["status"] }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingMethod) {
        throw new NotFoundError("Méthode introuvable.");
    }

    await assertMethodLifecycle(adminSupabase, normalizedInput, existingMethod.status);

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
    const stepRowsToSave = createStepRows(methodId, normalizedInput);
    const finalStepRows = stepRowsToSave.map((stepRow, index) => {
        const existingStep = findExistingStep(
            stepRow,
            normalizedInput.steps[index],
            existingStepsById,
            existingStepsByKey,
            existingStepsByOrder,
        );

        return {
            ...stepRow,
            aliases: existingStep?.aliases ?? [],
            code: stepRow.code ?? existingStep?.code ?? null,
            id: existingStep?.id ?? randomUUID(),
            notation_step_id: existingStep?.notation_step_id ?? null,
            weight: existingStep?.weight ?? stepRow.weight,
        };
    });
    const stepIdsByOrder = new Map(finalStepRows.map((step) => [step.step_order, step.id]));
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
            context.userId,
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
    const finalResourceRows = resourceRowsToSave.map((resourceRow) => {
        const existingResource = resourceRow.id ? existingResourcesById.get(resourceRow.id) : undefined;
        return {
            ...resourceRow,
            duration_seconds: existingResource?.duration_seconds ?? null,
            id: existingResource?.id ?? resourceRow.id ?? randomUUID(),
            notation_file_id: existingResource?.notation_file_id ?? null,
        };
    });

    try {
        const { error } = await adminSupabase.rpc("admin_update_method_aggregate", {
            p_method: createMethodUpdate(materializedInput),
            p_method_id: methodId,
            p_quiz_id: materializedInput.quizId,
            p_resources: finalResourceRows,
            p_steps: finalStepRows,
        });
        if (error) throw mapDatabaseError(error);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedStorageObjects(adminSupabase, uploadedObjects);
        }
        throw error;
    }

    const [methodResult, stepsResult, resourcesResult] = await Promise.all([
        adminSupabase.from("methods").select(METHOD_SELECT).eq("id", methodId).single<MethodRow>(),
        adminSupabase.from("method_steps").select(METHOD_STEP_SELECT).eq("method_id", methodId)
            .order("step_order", { ascending: true }),
        adminSupabase.from("method_resources").select(METHOD_RESOURCE_SELECT).eq("method_id", methodId)
            .order("sort_order", { ascending: true }),
    ]);
    if (methodResult.error) throw methodResult.error;
    if (stepsResult.error) throw stepsResult.error;
    if (resourcesResult.error) throw resourcesResult.error;

    const savedSteps = (stepsResult.data ?? []) as MethodStepRow[];
    const resourceRows = (resourcesResult.data ?? []) as MethodResourceRow[];
    await cleanupStaleMethodResourceFiles(adminSupabase, existingResources, resourceRows).catch((cleanupError) => {
        console.error("Unable to remove previous method resource files:", cleanupError);
    });
    const [methodWithOrganizationName] = await withMethodOrganizationNames([methodResult.data]);

    return mapMethodRowsToDetail(methodWithOrganizationName, savedSteps, resourceRows);
}
