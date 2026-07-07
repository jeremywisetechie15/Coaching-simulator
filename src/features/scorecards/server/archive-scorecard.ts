import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveScorecard(scorecardId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { data: linkedRoleplay, error: linkedRoleplayError } = await adminSupabase
        .from("scenarios")
        .select("id")
        .eq("scorecard_id", scorecardId)
        .limit(1)
        .maybeSingle<{ id: string }>();

    if (linkedRoleplayError) {
        throw linkedRoleplayError;
    }

    if (linkedRoleplay) {
        throw new ConflictError("Impossible de supprimer cette scorecard : elle est déjà associée à un roleplay.");
    }

    const { data, error } = await adminSupabase
        .from("scorecards")
        .update({
            is_active: false,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", scorecardId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Scorecard introuvable.");
    }
}
