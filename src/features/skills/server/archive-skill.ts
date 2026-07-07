import { requireAdmin } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archiveSkill(skillId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("skills")
        .update({
            is_active: false,
            status: "archived",
            updated_at: new Date().toISOString(),
        })
        .eq("id", skillId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Compétence introuvable.");
    }
}
