import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, mapDatabaseError, NotFoundError } from "@/lib/server/errors";
import {
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { assertScorecardMatchesMethod, resolveNotationMethodId } from "./create-roleplay";
import { fetchRoleplayDetail } from "./roleplay-query";
import { assertRoleplayQuizzesMatchMethod } from "./roleplay-quiz-assignment.validation";
import {
    createRoleplayUpdate,
    createScenarioQuizRows,
    createScenarioResourceRows,
    SCENARIO_RESOURCE_SELECT,
} from "./roleplay.persistence";
import {
    cleanupStaleScenarioResourceFiles,
    type ScenarioResourceRow,
} from "./save-roleplay-children";
import {
    cleanupUploadedRoleplayStorageObjects,
    materializeScenarioResourceUploads,
    type RoleplayUploadFilesByClientId,
    type UploadedRoleplayStorageObject,
} from "./roleplay-upload-files";
import { assertRoleplayLifecycle } from "./assert-roleplay-lifecycle";

export async function updateRoleplay(
    roleplayId: string,
    input: SaveRoleplayDto,
    uploadFilesByClientId: RoleplayUploadFilesByClientId = new Map(),
    backgroundFile: File | null = null,
): Promise<RoleplayDetail> {
    const context = await requireAdmin();
    await assertScorecardMatchesMethod(input);
    await assertRoleplayQuizzesMatchMethod(input);

    const adminSupabase = createAdminClient();
    const notationMethodId = await resolveNotationMethodId(input.methodId);
    const uploadedObjects: UploadedRoleplayStorageObject[] = [];
    const { data: existingRoleplay, error: existingRoleplayError } = await adminSupabase
        .from("scenarios")
        .select("background_image_path, status")
        .eq("id", roleplayId)
        .maybeSingle<{ background_image_path: string | null; status: SaveRoleplayDto["status"] }>();

    if (existingRoleplayError) throw existingRoleplayError;
    if (!existingRoleplay) throw new NotFoundError("Roleplay introuvable.");
    await assertRoleplayLifecycle(adminSupabase, input, existingRoleplay.status);
    if (
        !backgroundFile &&
        input.backgroundImagePath &&
        input.backgroundImagePath !== existingRoleplay.background_image_path
    ) {
        throw new AppError(
            "Le fond de session sélectionné n'appartient pas à ce roleplay.",
            400,
            "ROLEPLAY_BACKGROUND_INVALID",
        );
    }

    const uploadedBackground = backgroundFile
        ? await uploadSessionBackground(adminSupabase, SESSION_BACKGROUND_OWNER.roleplay, roleplayId, backgroundFile)
        : null;
    if (uploadedBackground) uploadedObjects.push(uploadedBackground);
    const nextBackgroundPath = uploadedBackground?.path ?? (input.backgroundImagePath || null);
    const resolvedInput = { ...input, backgroundImagePath: nextBackgroundPath ?? "" };

    let currentResources: ScenarioResourceRow[] = [];
    let savedResources: ScenarioResourceRow[] = [];

    try {
        const materializedInput = await materializeScenarioResourceUploads(
            adminSupabase,
            roleplayId,
            resolvedInput,
            uploadFilesByClientId,
            uploadedObjects,
            context.userId,
        );
        const { data, error: currentResourcesError } = await adminSupabase
            .from("scenario_resources")
            .select(SCENARIO_RESOURCE_SELECT)
            .eq("scenario_id", roleplayId)
            .returns<ScenarioResourceRow[]>();

        if (currentResourcesError) throw currentResourcesError;
        currentResources = data ?? [];

        const resources = createScenarioResourceRows(roleplayId, materializedInput).map((resource) => ({
            ...resource,
            id: resource.id ?? randomUUID(),
        }));
        const { error } = await adminSupabase.rpc("admin_update_roleplay_aggregate", {
            p_ai_instructions: materializedInput.aiInstructions,
            p_quizzes: createScenarioQuizRows(roleplayId, materializedInput),
            p_resources: resources,
            p_roleplay: createRoleplayUpdate(materializedInput, notationMethodId),
            p_roleplay_id: roleplayId,
        });
        savedResources = resources as ScenarioResourceRow[];

        if (error) throw mapDatabaseError(error);

    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedRoleplayStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }

    const roleplay = await fetchRoleplayDetail(adminSupabase, roleplayId);
    await cleanupStaleScenarioResourceFiles(adminSupabase, currentResources, savedResources).catch((cleanupError) => {
        console.error("Unable to remove previous roleplay resource files:", cleanupError);
    });
    if (
        existingRoleplay.background_image_path &&
        existingRoleplay.background_image_path !== nextBackgroundPath
    ) {
        await removeSessionBackground(adminSupabase, existingRoleplay.background_image_path).catch((cleanupError) => {
            console.error("Unable to remove previous roleplay background:", cleanupError);
        });
    }

    return roleplay;
}
