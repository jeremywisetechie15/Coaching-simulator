import { requireAdmin } from "@/features/auth/server";
import type { RoleplayDetail } from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { createAdminClient } from "@/lib/supabase/admin";
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
): Promise<RoleplayDetail> {
    await requireAdmin();
    await assertScorecardMatchesMethod(input);
    await assertRoleplayQuizzesMatchMethod(input);

    const adminSupabase = createAdminClient();
    const notationMethodId = await resolveNotationMethodId(input.methodId);
    const uploadedObjects: UploadedRoleplayStorageObject[] = [];

    try {
        const { error } = await adminSupabase
            .from("scenarios")
            .update(createRoleplayUpdate(input, notationMethodId))
            .eq("id", roleplayId);

        if (error) throw error;

        await saveRoleplayChildren(adminSupabase, roleplayId, input, uploadFilesByClientId, uploadedObjects);

        return fetchRoleplayDetail(adminSupabase, roleplayId);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedRoleplayStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }
}
