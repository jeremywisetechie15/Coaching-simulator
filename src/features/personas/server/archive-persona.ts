import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { assertNotUsedByPublishedRoleplay } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

export async function archivePersona(personaId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    await assertNotUsedByPublishedRoleplay(adminSupabase, {
        column: "persona_id",
        entityId: personaId,
        entityLabel: "ce persona",
    });

    const { data, error } = await adminSupabase
        .from("personas")
        .update({ status: CONTENT_STATUS.archived, updated_at: new Date().toISOString() })
        .eq("id", personaId)
        .select("id")
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Persona introuvable.");
}
