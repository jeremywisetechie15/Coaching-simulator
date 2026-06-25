import { requireAdmin } from "@/features/auth/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToListItem, type PersonaRow } from "./persona.mapper";

export async function updatePersona(personaId: string, input: SavePersonaDto): Promise<PersonaListItem> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("personas")
        .update({
            avatar_url: input.avatarUrl || null,
            company: input.company || null,
            name: input.name,
            role: input.role || null,
            system_instructions: input.systemInstructions,
            updated_at: new Date().toISOString(),
            voice_id: input.voiceId,
        })
        .eq("id", personaId)
        .select("id, name, role, company, voice_id, system_instructions, avatar_url, created_at, status")
        .maybeSingle<PersonaRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Persona introuvable.");
    }

    return mapPersonaRowToListItem(data);
}
