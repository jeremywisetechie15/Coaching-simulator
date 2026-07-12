import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ConflictError } from "@/lib/server/errors";

export type PublishedRoleplayReferenceColumn = "coach_id" | "persona_id";

interface PublishedRoleplayReferenceOptions {
    column: PublishedRoleplayReferenceColumn;
    entityId: string;
    entityLabel: string;
}

export async function assertNotUsedByPublishedRoleplay(
    supabase: SupabaseClient,
    { column, entityId, entityLabel }: PublishedRoleplayReferenceOptions,
) {
    const { data, error } = await supabase
        .from("scenarios")
        .select("id")
        .eq(column, entityId)
        .eq("status", CONTENT_STATUS.published)
        .limit(1)
        .maybeSingle<{ id: string }>();

    if (error) throw error;

    if (data) {
        throw new ConflictError(
            `Impossible de supprimer ${entityLabel} car il est associé à un roleplay publié.`,
        );
    }
}
