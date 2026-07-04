import { requireAdmin } from "@/features/auth/server";
import type { MethodDetail } from "@/features/methods/domain/method";
import type { SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapMethodRowsToDetail,
    type MethodResourceRow,
    type MethodRow,
    type MethodStepRow,
} from "./method.mapper";
import { syncMethodNotationFiles } from "./method-notation-files";
import { withMethodOrganizationNames } from "./method-organization-names";
import { syncMethodQuizAssociation } from "./method-quiz-association";
import {
    createMethodInsert,
    createResourceRows,
    createStepRows,
    createUniqueMethodCode,
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

export async function createMethod(
    input: SaveMethodDto,
    uploadFilesByClientId: MethodUploadFilesByClientId = new Map(),
): Promise<MethodDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const normalizedInput = normalizeMethodScopeForWrite(context, input);
    const code = await createUniqueMethodCode(adminSupabase, normalizedInput.name);
    let createdMethodId: string | null = null;
    const uploadedObjects: UploadedStorageObject[] = [];

    try {
        const { data: methodRow, error: methodError } = await adminSupabase
            .from("methods")
            .insert(createMethodInsert(normalizedInput, code, context.userId))
            .select(METHOD_SELECT)
            .single<MethodRow>();

        if (methodError) {
            throw methodError;
        }

        createdMethodId = methodRow.id;

        const stepRowsToInsert = createStepRows(methodRow.id, normalizedInput);
        const { data: stepRows, error: stepsError } = await adminSupabase
            .from("method_steps")
            .insert(stepRowsToInsert)
            .select(METHOD_STEP_SELECT)
            .order("step_order", { ascending: true });

        if (stepsError) {
            throw stepsError;
        }

        const savedSteps = (stepRows ?? []) as MethodStepRow[];
        const stepIdsByOrder = new Map(savedSteps.map((step) => [step.step_order, step.id]));
        const materializedInput = await materializeMethodResourceUploads(
            adminSupabase,
            methodRow.id,
            normalizedInput,
            stepIdsByOrder,
            uploadFilesByClientId,
            uploadedObjects,
        );
        const resourceRowsToInsert = createResourceRows(methodRow.id, materializedInput, stepIdsByOrder);
        let resourceRows: MethodResourceRow[] = [];

        if (resourceRowsToInsert.length > 0) {
            const { data, error: resourcesError } = await adminSupabase
                .from("method_resources")
                .insert(resourceRowsToInsert)
                .select(METHOD_RESOURCE_SELECT)
                .order("sort_order", { ascending: true });

            if (resourcesError) {
                throw resourcesError;
            }

            resourceRows = (data ?? []) as MethodResourceRow[];
        }

        if (resourceRows.length > 0) {
            const synced = await syncMethodNotationFiles(adminSupabase, methodRow, resourceRows);
            resourceRows = synced.resources;
        }

        await syncMethodQuizAssociation(adminSupabase, methodRow.id, normalizedInput.quizId);

        const [methodWithOrganizationName] = await withMethodOrganizationNames([methodRow]);

        return mapMethodRowsToDetail(methodWithOrganizationName, savedSteps, resourceRows);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedStorageObjects(adminSupabase, uploadedObjects);
        }

        if (createdMethodId) {
            await adminSupabase.from("methods").delete().eq("id", createdMethodId);
        }

        throw error;
    }
}
