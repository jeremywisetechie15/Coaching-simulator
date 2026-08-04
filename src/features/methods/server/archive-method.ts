import type { SupabaseClient } from "@supabase/supabase-js";
import { removeContent, type ContentStorageObject } from "@/features/content/server";

async function loadMethodStorageObjects(
    supabase: SupabaseClient,
    methodId: string,
): Promise<ContentStorageObject[]> {
    const { data, error } = await supabase
        .from("method_resources")
        .select("bucket, path")
        .eq("method_id", methodId)
        .returns<Array<{ bucket: string | null; path: string | null }>>();

    if (error) throw error;

    return (data ?? []).flatMap(({ bucket, path }) =>
        bucket && path ? [{ bucket, path }] : [],
    );
}

export async function removeMethod(methodId: string) {
    return removeContent({
        archiveChanges: { is_active: false },
        dependencyChecks: [
            { column: "method_id", table: "scenarios" },
            { column: "method_id", table: "quizzes" },
            { column: "method_id", table: "scorecards" },
        ],
        entityId: methodId,
        entityLabel: "Méthode",
        loadStorageObjects: loadMethodStorageObjects,
        table: "methods",
    });
}
