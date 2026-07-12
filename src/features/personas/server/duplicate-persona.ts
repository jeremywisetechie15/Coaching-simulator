import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { savePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPersonaById } from "./get-persona-by-id";
import { mapPersonaRowToListItem, PERSONA_SELECT, type PersonaRow } from "./persona.mapper";
import { copyPersonaAvatar, isOwnedPersonaAvatarPath, removePersonaAvatar } from "./persona-avatar";
import { createPersonaInsert } from "./persona.persistence";

export async function duplicatePersona(personaId: string): Promise<PersonaListItem> {
    const context = await requireAdmin();
    const source = await getPersonaById(personaId);

    if (!source) throw new NotFoundError("Persona introuvable.");

    const adminSupabase = createAdminClient();
    const duplicateId = crypto.randomUUID();
    const now = new Date().toISOString();
    const duplicateName = await resolveDuplicateName(adminSupabase, {
        column: "name",
        maxLength: 160,
        sourceName: source.name,
        table: "personas",
    });
    const baseInput = savePersonaDto.parse({
        ...source,
        name: duplicateName,
    });
    const duplicatedAvatarUrl = await copyPersonaAvatar(adminSupabase, source.avatarUrl, duplicateId);
    const input = {
        ...baseInput,
        avatarUrl: duplicatedAvatarUrl ?? "",
    };

    const { data, error } = await adminSupabase
        .from("personas")
        .insert(createPersonaInsert(input, {
            avatarUrl: duplicatedAvatarUrl,
            createdBy: context.userId,
            id: duplicateId,
            now,
            status: CONTENT_STATUS.draft,
        }))
        .select(PERSONA_SELECT)
        .single<PersonaRow>();

    if (error) {
        if (isOwnedPersonaAvatarPath(duplicatedAvatarUrl, duplicateId)) {
            await removePersonaAvatar(adminSupabase, duplicatedAvatarUrl).catch(() => undefined);
        }
        throw error;
    }

    return mapPersonaRowToListItem(data);
}
