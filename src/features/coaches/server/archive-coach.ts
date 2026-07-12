import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { assertNotUsedByPublishedRoleplay } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveCoach(coachId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    await assertNotUsedByPublishedRoleplay(adminSupabase, {
        column: "coach_id",
        entityId: coachId,
        entityLabel: "ce coach",
    });

    const { data, error } = await adminSupabase
        .from("coaches")
        .update({ status: CONTENT_STATUS.archived, updated_at: new Date().toISOString() })
        .eq("id", coachId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Coach introuvable.");
}
