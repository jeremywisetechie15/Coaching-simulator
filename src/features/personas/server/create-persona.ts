import { requireAdmin } from "@/features/auth/server";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";
import {
    isPersonaAvatarStoragePath,
    type PersonaListItem,
} from "@/features/personas/domain/persona-list";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { AppError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapPersonaRowToListItem,
    PERSONA_SELECT,
    toNullableInteger,
    type PersonaRow,
} from "./persona.mapper";
import { removePersonaAvatar, uploadPersonaAvatar } from "./persona-avatar";

export async function createPersona(
    input: SavePersonaDto,
    avatarFile: File | null = null,
): Promise<PersonaListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();
    const personaId = crypto.randomUUID();

    if (!avatarFile && isPersonaAvatarStoragePath(input.avatarUrl)) {
        throw new AppError(
            "Un avatar existant ne peut pas être attribué à un nouveau persona.",
            400,
            "PERSONA_AVATAR_INVALID",
        );
    }

    const uploadedAvatarPath = avatarFile
        ? await uploadPersonaAvatar(adminSupabase, personaId, avatarFile)
        : null;

    const { data, error } = await adminSupabase
        .from("personas")
        .insert({
            age: toNullableInteger(input.age),
            annual_revenue: input.annualRevenue || null,
            avatar_url: uploadedAvatarPath ?? (input.avatarUrl || null),
            children_count: toNullableInteger(input.childrenCount),
            company: input.company || null,
            company_description: input.companyDescription || null,
            created_at: now,
            created_by: context.userId,
            diploma: input.diploma || null,
            disc_profile: input.discProfile || null,
            employee_count: toNullableInteger(input.employeeCount),
            industry: input.industry || null,
            id: personaId,
            marital_status: input.maritalStatus || null,
            name: input.name,
            nationality: input.nationality || null,
            residence_country: input.residenceCountry || null,
            role: input.role || null,
            status: PUBLISHED_CONTENT_STATUS,
            system_instructions: input.systemInstructions,
            updated_at: now,
            voice_id: input.voiceId,
        })
        .select(PERSONA_SELECT)
        .single<PersonaRow>();

    if (error) {
        if (uploadedAvatarPath) {
            await removePersonaAvatar(adminSupabase, uploadedAvatarPath).catch(() => undefined);
        }
        throw error;
    }

    return mapPersonaRowToListItem(data);
}
