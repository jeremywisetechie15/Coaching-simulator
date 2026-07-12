import { requireAdmin } from "@/features/auth/server";
import {
    isPersonaAvatarStoragePath,
    type PersonaListItem,
} from "@/features/personas/domain/persona-list";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    mapPersonaRowToListItem,
    PERSONA_SELECT,
    toNullableInteger,
    type PersonaRow,
} from "./persona.mapper";
import {
    isOwnedPersonaAvatarPath,
    removePersonaAvatar,
    uploadPersonaAvatar,
} from "./persona-avatar";

export async function updatePersona(
    personaId: string,
    input: SavePersonaDto,
    avatarFile: File | null = null,
): Promise<PersonaListItem> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data: existingPersona, error: existingPersonaError } = await adminSupabase
        .from("personas")
        .select("avatar_url")
        .eq("id", personaId)
        .maybeSingle<{ avatar_url: string | null }>();

    if (existingPersonaError) throw existingPersonaError;
    if (!existingPersona) throw new NotFoundError("Persona introuvable.");
    if (
        !avatarFile &&
        isPersonaAvatarStoragePath(input.avatarUrl) &&
        input.avatarUrl !== existingPersona.avatar_url
    ) {
        throw new AppError(
            "L'avatar sélectionné n'appartient pas à ce persona.",
            400,
            "PERSONA_AVATAR_INVALID",
        );
    }

    const uploadedAvatarPath = avatarFile
        ? await uploadPersonaAvatar(adminSupabase, personaId, avatarFile)
        : null;
    const nextAvatarUrl = uploadedAvatarPath ?? (input.avatarUrl || null);
    const { data, error } = await adminSupabase
        .from("personas")
        .update({
            age: toNullableInteger(input.age),
            annual_revenue: input.annualRevenue || null,
            avatar_url: nextAvatarUrl,
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
            net_income_before_tax: input.netIncomeBeforeTax || null,
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
        if (uploadedAvatarPath) {
            await removePersonaAvatar(adminSupabase, uploadedAvatarPath).catch(() => undefined);
        }
        throw error;
    }

    if (!data) {
        if (uploadedAvatarPath) {
            await removePersonaAvatar(adminSupabase, uploadedAvatarPath).catch(() => undefined);
        }
        throw new NotFoundError("Persona introuvable.");
    }

    if (
        existingPersona.avatar_url !== nextAvatarUrl &&
        isOwnedPersonaAvatarPath(existingPersona.avatar_url, personaId)
    ) {
        await removePersonaAvatar(adminSupabase, existingPersona.avatar_url).catch((cleanupError) => {
            console.error("Unable to remove previous persona avatar:", cleanupError);
        });
    }

    return mapPersonaRowToListItem(data);
}
