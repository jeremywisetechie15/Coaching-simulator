import { requireAdmin } from "@/features/auth/server";
import { assertInitialContentStatus } from "@/features/content/server";
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
    type PersonaRow,
} from "./persona.mapper";
import { removePersonaAvatar, uploadPersonaAvatar } from "./persona-avatar";
import { createPersonaCv } from "./persona-cv";
import { createPersonaInsert } from "./persona.persistence";

export async function createPersona(
    input: SavePersonaDto,
    avatarFile: File | null = null,
): Promise<PersonaListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();
    const personaId = crypto.randomUUID();

    assertInitialContentStatus(input.status);

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

    let data: PersonaRow;

    try {
        const result = await adminSupabase
            .from("personas")
            .insert(createPersonaInsert(input, {
                avatarUrl: uploadedAvatarPath ?? (input.avatarUrl || null),
                createdBy: context.userId,
                id: personaId,
                now,
                status: input.status,
            }))
            .select(PERSONA_SELECT)
            .single<PersonaRow>();

        if (result.error) throw result.error;
        data = result.data;
    } catch (error) {
        if (uploadedAvatarPath) {
            await removePersonaAvatar(adminSupabase, uploadedAvatarPath).catch(() => undefined);
        }
        throw error;
    }

    try {
        await createPersonaCv(adminSupabase, personaId, context.userId, input.cv);
    } catch (cvError) {
        const { error: rollbackError } = await adminSupabase.from("personas").delete().eq("id", personaId);
        if (rollbackError) {
            console.error("Unable to roll back persona after CV failure:", rollbackError);
        }
        if (uploadedAvatarPath) {
            await removePersonaAvatar(adminSupabase, uploadedAvatarPath).catch(() => undefined);
        }
        throw cvError;
    }

    return mapPersonaRowToListItem(data);
}
