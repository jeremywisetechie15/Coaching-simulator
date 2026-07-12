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
    type PersonaRow,
} from "./persona.mapper";
import { removePersonaAvatar, uploadPersonaAvatar } from "./persona-avatar";
import { createPersonaInsert } from "./persona.persistence";

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
        .insert(createPersonaInsert(input, {
            avatarUrl: uploadedAvatarPath ?? (input.avatarUrl || null),
            createdBy: context.userId,
            id: personaId,
            now,
            status: PUBLISHED_CONTENT_STATUS,
        }))
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
