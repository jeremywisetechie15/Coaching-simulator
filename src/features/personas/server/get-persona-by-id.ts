import { requireAdmin } from "@/features/auth/server";
import type { PersonaEditorValues } from "@/features/personas/domain/persona-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToEditorValues, type PersonaRow } from "./persona.mapper";

export async function getPersonaById(personaId: string): Promise<PersonaEditorValues | null> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("personas")
        .select("id, name, role, company, voice_id, system_instructions, avatar_url, created_at")
        .eq("id", personaId)
        .maybeSingle<PersonaRow>();

    if (error) {
        throw error;
    }

    return data ? mapPersonaRowToEditorValues(data) : null;
}
