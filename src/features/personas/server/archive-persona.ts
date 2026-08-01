import type { SupabaseClient } from "@supabase/supabase-js";
import { removeContent, type ContentStorageObject } from "@/features/content/server";
import { PERSONA_AVATAR_BUCKET } from "@/features/personas/domain/persona-list";
import { normalizeStorageAvatarPath } from "@/lib/uploads/avatar-path";
import { PERSONA_CV_UPLOAD_BUCKET } from "@/lib/uploads/content-upload";
import { isOwnedPersonaAvatarPath } from "./persona-avatar";

async function loadPersonaStorageObjects(
    supabase: SupabaseClient,
    personaId: string,
): Promise<ContentStorageObject[]> {
    const [personaResult, cvResult] = await Promise.all([
        supabase
            .from("personas")
            .select("avatar_url")
            .eq("id", personaId)
            .maybeSingle<{ avatar_url: string | null }>(),
        supabase
            .from("persona_cv_documents")
            .select("storage_path")
            .eq("persona_id", personaId)
            .maybeSingle<{ storage_path: string }>(),
    ]);

    if (personaResult.error) throw personaResult.error;
    if (cvResult.error) throw cvResult.error;

    const avatarPath = personaResult.data?.avatar_url;
    return [
        ...(isOwnedPersonaAvatarPath(avatarPath, personaId) && avatarPath
            ? [{
                bucket: PERSONA_AVATAR_BUCKET,
                path: normalizeStorageAvatarPath(avatarPath, PERSONA_AVATAR_BUCKET),
            }]
            : []),
        ...(cvResult.data?.storage_path
            ? [{ bucket: PERSONA_CV_UPLOAD_BUCKET, path: cvResult.data.storage_path }]
            : []),
    ];
}

export async function removePersona(personaId: string) {
    return removeContent({
        dependencyChecks: [{ column: "persona_id", table: "scenarios" }],
        entityId: personaId,
        entityLabel: "Persona",
        loadStorageObjects: loadPersonaStorageObjects,
        table: "personas",
    });
}
