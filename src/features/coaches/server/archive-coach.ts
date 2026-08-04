import type { SupabaseClient } from "@supabase/supabase-js";
import { COACH_AVATAR_BUCKET } from "@/features/coaches/domain/coach-list";
import { removeContent, type ContentStorageObject } from "@/features/content/server";
import { normalizeStorageAvatarPath } from "@/lib/uploads/avatar-path";
import { SESSION_BACKGROUND_UPLOAD_BUCKET } from "@/lib/uploads/content-upload";
import { isOwnedCoachAvatarPath } from "./coach-avatar";

async function loadCoachStorageObjects(
    supabase: SupabaseClient,
    coachId: string,
): Promise<ContentStorageObject[]> {
    const { data, error } = await supabase
        .from("coaches")
        .select("avatar_url, background_image_path")
        .eq("id", coachId)
        .maybeSingle<{ avatar_url: string | null; background_image_path: string | null }>();

    if (error) throw error;
    if (!data) return [];

    return [
        ...(isOwnedCoachAvatarPath(data.avatar_url, coachId) && data.avatar_url
            ? [{
                bucket: COACH_AVATAR_BUCKET,
                path: normalizeStorageAvatarPath(data.avatar_url, COACH_AVATAR_BUCKET),
            }]
            : []),
        ...(data.background_image_path?.startsWith(`coaches/${coachId}/`)
            ? [{ bucket: SESSION_BACKGROUND_UPLOAD_BUCKET, path: data.background_image_path }]
            : []),
    ];
}

export async function removeCoach(coachId: string) {
    return removeContent({
        dependencyChecks: [{ column: "coach_id", table: "scenarios" }],
        entityId: coachId,
        entityLabel: "Coach",
        loadStorageObjects: loadCoachStorageObjects,
        table: "coaches",
    });
}
