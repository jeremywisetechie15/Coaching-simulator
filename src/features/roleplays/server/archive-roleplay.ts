import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveRoleplay(roleplayId: string) {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
        .from("scenarios")
        .update({
            is_active: false,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", roleplayId);

    if (error) throw error;
}
