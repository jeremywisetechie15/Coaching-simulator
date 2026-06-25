import { requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToListItem, type PersonaRow } from "./persona.mapper";

export async function listPersonas(): Promise<PersonaListItem[]> {
    const context = await requireAuth();

    const adminSupabase = createAdminClient();

    let query = adminSupabase
        .from("personas")
        .select("id, name, role, company, voice_id, system_instructions, avatar_url, created_at, status")
        .order("created_at", { ascending: false });

    if (context.platformRole !== "admin") {
        query = query.eq("status", CONTENT_STATUS.published);
    }

    const { data, error } = await query.returns<PersonaRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapPersonaRowToListItem);
}
