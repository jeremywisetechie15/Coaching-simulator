import { requireAdmin } from "@/features/auth/server";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { AppError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { fetchRoleplayDetail } from "./roleplay-query";
import { assertRoleplayQuizzesMatchMethod } from "./roleplay-quiz-assignment.validation";
import { createRoleplayInsert } from "./roleplay.persistence";
import { saveRoleplayChildren } from "./save-roleplay-children";
import {
    cleanupUploadedRoleplayStorageObjects,
    type RoleplayUploadFilesByClientId,
    type UploadedRoleplayStorageObject,
} from "./roleplay-upload-files";

export async function resolveNotationMethodId(methodId: string | null) {
    if (!methodId) return null;

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("methods")
        .select("notation_method_id")
        .eq("id", methodId)
        .maybeSingle<{ notation_method_id: string | null }>();

    if (error) throw error;

    return data?.notation_method_id ?? null;
}

export async function assertScorecardMatchesMethod(input: SaveRoleplayDto) {
    if (!input.scorecardId || !input.methodId) return;

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("scorecards")
        .select("method_id")
        .eq("id", input.scorecardId)
        .maybeSingle<{ method_id: string | null }>();

    if (error) throw error;

    if (!data) {
        throw new AppError("La scorecard sélectionnée est introuvable.", 400, "VALIDATION_ERROR");
    }

    if (data.method_id !== input.methodId) {
        throw new AppError("La scorecard sélectionnée ne correspond pas à la méthode du roleplay.", 400, "VALIDATION_ERROR");
    }
}

export async function createRoleplay(
    input: SaveRoleplayDto,
    uploadFilesByClientId: RoleplayUploadFilesByClientId = new Map(),
    backgroundFile: File | null = null,
): Promise<RoleplayDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const notationMethodId = await resolveNotationMethodId(input.methodId);
    const uploadedObjects: UploadedRoleplayStorageObject[] = [];
    let createdRoleplayId: string | null = null;

    await assertScorecardMatchesMethod(input);
    await assertRoleplayQuizzesMatchMethod(input);

    if (!backgroundFile && input.backgroundImagePath) {
        throw new AppError(
            "Un fond existant ne peut pas être attribué à un nouveau roleplay.",
            400,
            "ROLEPLAY_BACKGROUND_INVALID",
        );
    }

    try {
        const { data, error } = await adminSupabase
            .from("scenarios")
            .insert(createRoleplayInsert(input, context.userId, notationMethodId))
            .select("id")
            .single<{ id: string }>();

        if (error) throw error;
        if (!data?.id) {
            throw new Error("Le roleplay a été créé mais son identifiant est introuvable.");
        }

        createdRoleplayId = data.id;
        if (backgroundFile) {
            const uploadedBackground = await uploadSessionBackground(
                adminSupabase,
                SESSION_BACKGROUND_OWNER.roleplay,
                data.id,
                backgroundFile,
            );
            uploadedObjects.push(uploadedBackground);

            const { error: backgroundUpdateError } = await adminSupabase
                .from("scenarios")
                .update({ background_image_path: uploadedBackground.path })
                .eq("id", data.id);

            if (backgroundUpdateError) throw backgroundUpdateError;
        }
        await saveRoleplayChildren(adminSupabase, data.id, input, uploadFilesByClientId, uploadedObjects);

        return fetchRoleplayDetail(adminSupabase, data.id);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedRoleplayStorageObjects(adminSupabase, uploadedObjects);
        }

        if (createdRoleplayId) {
            await adminSupabase.from("scenarios").delete().eq("id", createdRoleplayId);
        }

        throw error;
    }
}
