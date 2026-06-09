import { requireAdmin } from "@/features/auth/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapPersonaRowToListItem, type PersonaRow } from "./persona.mapper";

const personaSelect = "id, name, role, company, voice_id, system_instructions, avatar_url, created_at";

export async function createPersona(input: SavePersonaDto): Promise<PersonaListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await adminSupabase
        .from("personas")
        .insert({
            avatar_url: input.avatarUrl || null,
            company: input.company || null,
            created_at: now,
            created_by: context.userId,
            name: input.name,
            role: input.role || null,
            system_instructions: input.systemInstructions,
            updated_at: now,
            voice_id: input.voiceId,
        })
        .select(personaSelect)
        .single<PersonaRow>();

    if (error) {
        throw error;
    }

    return mapPersonaRowToListItem(data);
}
