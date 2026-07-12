import { requireAdmin, requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { PersonaDetail, PersonaEditorValues } from "@/features/personas/domain/persona-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToDetail, mapPersonaRowToEditorValues, PERSONA_SELECT, type PersonaRow } from "./persona.mapper";

export async function getPersonaById(personaId: string): Promise<PersonaEditorValues | null> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("personas")
        .select(PERSONA_SELECT)
        .eq("id", personaId)
        .maybeSingle<PersonaRow>();

    if (error) {
        throw error;
    }

    return data ? mapPersonaRowToEditorValues(data) : null;
}

export async function getPersonaDetailById(personaId: string): Promise<PersonaDetail | null> {
    const context = await requireAuth();
    const adminSupabase = createAdminClient();
    let query = adminSupabase
        .from("personas")
        .select(PERSONA_SELECT)
        .eq("id", personaId);

    if (context.platformRole !== "admin") {
        query = query.eq("status", CONTENT_STATUS.published);
    }

    const { data, error } = await query.maybeSingle<PersonaRow>();

    if (error) throw error;
    return data ? mapPersonaRowToDetail(data) : null;
}
