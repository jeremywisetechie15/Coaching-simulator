import { requireAdmin } from "@/features/auth/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapPersonaRowToListItem,
    PERSONA_SELECT,
    toNullableInteger,
    type PersonaRow,
} from "./persona.mapper";

export async function updatePersona(personaId: string, input: SavePersonaDto): Promise<PersonaListItem> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("personas")
        .update({
            age: toNullableInteger(input.age),
            annual_revenue: input.annualRevenue || null,
            avatar_url: input.avatarUrl || null,
            children_count: toNullableInteger(input.childrenCount),
            company: input.company || null,
            company_description: input.companyDescription || null,
            diploma: input.diploma || null,
            disc_profile: input.discProfile || null,
            employee_count: toNullableInteger(input.employeeCount),
            industry: input.industry || null,
            marital_status: input.maritalStatus || null,
            name: input.name,
            nationality: input.nationality || null,
            residence_country: input.residenceCountry || null,
            role: input.role || null,
            system_instructions: input.systemInstructions,
            updated_at: new Date().toISOString(),
            voice_id: input.voiceId,
        })
        .eq("id", personaId)
        .select(PERSONA_SELECT)
        .maybeSingle<PersonaRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Persona introuvable.");
    }

    return mapPersonaRowToListItem(data);
}
