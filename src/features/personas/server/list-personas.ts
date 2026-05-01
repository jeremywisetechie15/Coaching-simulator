import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/features/auth/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { mapPersonaRowToListItem, type PersonaRow } from "./persona.mapper";

export async function listPersonas(): Promise<PersonaListItem[]> {
    await requireAuth();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("personas")
        .select("id, name, role, company, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .returns<PersonaRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapPersonaRowToListItem);
}
