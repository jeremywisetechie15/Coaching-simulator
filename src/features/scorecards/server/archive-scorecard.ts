import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS, type ContentStatus } from "@/features/content/domain";
import { assertContentStatusTransition } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveScorecard(scorecardId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
        .from("scorecards")
        .select("status")
        .eq("id", scorecardId)
        .maybeSingle<{ status: ContentStatus }>();

    if (existingError) throw existingError;
    if (!existing) throw new NotFoundError("Scorecard introuvable.");

    assertContentStatusTransition(existing.status, CONTENT_STATUS.archived);

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

    if (error) throw error;
    if (!data) throw new NotFoundError("Scorecard introuvable.");
}
