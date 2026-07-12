import { requireAdmin } from "@/features/auth/server";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError, NotFoundError } from "@/lib/server/errors";
import {
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { assertScorecardMatchesMethod, resolveNotationMethodId } from "./create-roleplay";
import { fetchRoleplayDetail } from "./roleplay-query";
import { assertRoleplayQuizzesMatchMethod } from "./roleplay-quiz-assignment.validation";
import { createRoleplayUpdate } from "./roleplay.persistence";
import { saveRoleplayChildren } from "./save-roleplay-children";
import {
    cleanupUploadedRoleplayStorageObjects,
    type RoleplayUploadFilesByClientId,
    type UploadedRoleplayStorageObject,
} from "./roleplay-upload-files";

export async function updateRoleplay(
    roleplayId: string,
    input: SaveRoleplayDto,
    uploadFilesByClientId: RoleplayUploadFilesByClientId = new Map(),
    backgroundFile: File | null = null,
): Promise<RoleplayDetail> {
    await requireAdmin();
    await assertScorecardMatchesMethod(input);
    await assertRoleplayQuizzesMatchMethod(input);

    const adminSupabase = createAdminClient();
    const notationMethodId = await resolveNotationMethodId(input.methodId);
    const uploadedObjects: UploadedRoleplayStorageObject[] = [];
    const { data: existingRoleplay, error: existingRoleplayError } = await adminSupabase
        .from("scenarios")
        .select("background_image_path")
        .eq("id", roleplayId)
        .maybeSingle<{ background_image_path: string | null }>();

    if (existingRoleplayError) throw existingRoleplayError;
    if (!existingRoleplay) throw new NotFoundError("Roleplay introuvable.");
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

    try {
        const { error } = await adminSupabase
            .from("scenarios")
            .update(createRoleplayUpdate(resolvedInput, notationMethodId))
            .eq("id", roleplayId);

        if (error) throw error;

        await saveRoleplayChildren(adminSupabase, roleplayId, resolvedInput, uploadFilesByClientId, uploadedObjects);

        const roleplay = await fetchRoleplayDetail(adminSupabase, roleplayId);

        if (
            existingRoleplay.background_image_path &&
            existingRoleplay.background_image_path !== nextBackgroundPath
        ) {
            await removeSessionBackground(adminSupabase, existingRoleplay.background_image_path).catch((cleanupError) => {
                console.error("Unable to remove previous roleplay background:", cleanupError);
            });
        }

        return roleplay;
    } catch (error) {
        await adminSupabase
            .from("scenarios")
            .update({ background_image_path: existingRoleplay.background_image_path })
            .eq("id", roleplayId);

        if (uploadedObjects.length > 0) {
            await cleanupUploadedRoleplayStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }
}
