import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { assertContentStatusTransition } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveRoleplay(roleplayId: string) {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
        .from("scenarios")
        .select("status")
        .eq("id", roleplayId)
        .maybeSingle<{ status: "draft" | "published" | "archived" }>();

    if (existingError) throw existingError;
    if (!existing) throw new NotFoundError("Roleplay introuvable.");

    assertContentStatusTransition(existing.status, CONTENT_STATUS.archived);

    const { data, error } = await adminSupabase
        .from("scenarios")
        .update({
            is_active: false,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", roleplayId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Roleplay introuvable.");
}
