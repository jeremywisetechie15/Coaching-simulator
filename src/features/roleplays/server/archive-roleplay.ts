import type { SupabaseClient } from "@supabase/supabase-js";
import { removeContent, type ContentStorageObject } from "@/features/content/server";
import { SESSION_BACKGROUND_UPLOAD_BUCKET } from "@/lib/uploads/content-upload";

async function loadRoleplayStorageObjects(
    supabase: SupabaseClient,
    roleplayId: string,
): Promise<ContentStorageObject[]> {
    const [roleplayResult, resourcesResult] = await Promise.all([
        supabase
            .from("scenarios")
            .select("background_image_path")
            .eq("id", roleplayId)
            .maybeSingle<{ background_image_path: string | null }>(),
        supabase
            .from("scenario_resources")
            .select("bucket, path")
            .eq("scenario_id", roleplayId)
            .returns<Array<{ bucket: string | null; path: string | null }>>(),
    ]);

    if (roleplayResult.error) throw roleplayResult.error;
    if (resourcesResult.error) throw resourcesResult.error;

    const backgroundPath = roleplayResult.data?.background_image_path;
    return [
        ...(backgroundPath?.startsWith(`roleplays/${roleplayId}/`)
            ? [{ bucket: SESSION_BACKGROUND_UPLOAD_BUCKET, path: backgroundPath }]
            : []),
        ...(resourcesResult.data ?? []).flatMap(({ bucket, path }) =>
            bucket && path ? [{ bucket, path }] : [],
        ),
    ];
}

export async function removeRoleplay(roleplayId: string) {
    return removeContent({
        archiveChanges: { is_active: false },
        dependencyChecks: [
            { column: "scenario_id", table: "sessions" },
            { column: "scenario_id", table: "scenario_user_assignments" },
            { column: "scenario_id", table: "roleplay_coach_notes" },
            { column: "scenario_id", table: "roleplay_session_results" },
            { column: "scenario_id", table: "roleplay_session_step_results" },
            { column: "scenario_id", table: "roleplay_session_criterion_results" },
        ],
        entityId: roleplayId,
        entityLabel: "Roleplay",
        loadStorageObjects: loadRoleplayStorageObjects,
        table: "scenarios",
    });
}
