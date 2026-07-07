import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertMethodCanBeArchived(supabase: SupabaseClient, methodId: string) {
    const { data, error } = await supabase
        .from("scenarios")
        .select("id")
        .eq("method_id", methodId)
        .limit(1)
        .maybeSingle<{ id: string }>();

    if (error) {
        throw error;
    }

    if (data) {
        throw new ConflictError("Impossible de supprimer cette méthode car elle est associée à un roleplay.");
    }
}

export async function archiveMethod(methodId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    await assertMethodCanBeArchived(adminSupabase, methodId);

    const { data, error } = await adminSupabase
        .from("methods")
        .update({
            is_active: false,
            status: CONTENT_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", methodId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Méthode introuvable.");
    }
}
