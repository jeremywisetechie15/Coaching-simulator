import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS, type ContentStatus } from "@/features/content/domain";
import { assertContentStatusTransition } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveCoach(coachId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
        .from("coaches")
        .select("status")
        .eq("id", coachId)
        .maybeSingle<{ status: ContentStatus }>();

    if (existingError) throw existingError;
    if (!existing) throw new NotFoundError("Coach introuvable.");

    assertContentStatusTransition(existing.status, CONTENT_STATUS.archived);

    const { data, error } = await adminSupabase
        .from("coaches")
        .update({ status: CONTENT_STATUS.archived, updated_at: new Date().toISOString() })
        .eq("id", coachId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Coach introuvable.");
}
