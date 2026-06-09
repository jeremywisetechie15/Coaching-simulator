import { requireAuth } from "@/features/auth/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToListItem, type PersonaRow } from "./persona.mapper";

export async function listPersonas(): Promise<PersonaListItem[]> {
    await requireAuth();

    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from("personas")
        .select("id, name, role, company, voice_id, system_instructions, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .returns<PersonaRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapPersonaRowToListItem);
}
