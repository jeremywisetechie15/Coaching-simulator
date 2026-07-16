import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/features/auth/server";
import type { PersonaCvSummary } from "@/features/personas/domain/persona-cv";
import type { PersonaCvInput } from "@/features/personas/dto/save-persona.dto";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { assertHttpUrl } from "@/lib/server/http-url";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    CONTENT_UPLOAD_PURPOSES,
    hasPdfFileSignature,
    PERSONA_CV_UPLOAD_BUCKET,
    PERSONA_CV_UPLOAD_MIME_TYPE,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { materializeDirectUpload } from "@/lib/uploads/direct-upload.server";

const PERSONA_CV_SELECT =
    "persona_id, storage_path, file_name, mime_type, size_bytes, uploaded_by, created_at, updated_at";
const PERSONA_CV_SIGNED_URL_TTL_SECONDS = 60;

interface PersonaCvRow {
    created_at: string;
    file_name: string;
    mime_type: string;
    persona_id: string;
    size_bytes: number;
    storage_path: string;
    updated_at: string;
    uploaded_by: string | null;
}

type PersonaCvUploadInput = Extract<PersonaCvInput, { kind: "upload" }>;

function mapPersonaCvRowToSummary(row: PersonaCvRow): PersonaCvSummary {
    return {
        fileName: row.file_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
    };
}

function sanitizePersonaCvFileName(fileName: string) {
    const baseName = fileName.replace(/\.[a-z0-9]{1,12}$/i, "");
    return sanitizeUploadFileName(baseName, PERSONA_CV_UPLOAD_MIME_TYPE);
}

export function isOwnedPersonaCvPath(path: string, personaId: string) {
    return path.startsWith(`personas/${personaId}/cv/`);
}

async function getPersonaCvRow(supabase: SupabaseClient, personaId: string) {
    const { data, error } = await supabase
        .from("persona_cv_documents")
        .select(PERSONA_CV_SELECT)
        .eq("persona_id", personaId)
        .maybeSingle<PersonaCvRow>();

    if (error) throw error;
    return data;
}

async function removePersonaCvStorageObject(
    supabase: SupabaseClient,
    personaId: string,
    storagePath: string,
) {
    if (!isOwnedPersonaCvPath(storagePath, personaId)) {
        throw new AppError("Chemin du CV invalide.", 500, "PERSONA_CV_PATH_INVALID");
    }

    const { error } = await supabase.storage.from(PERSONA_CV_UPLOAD_BUCKET).remove([storagePath]);
    if (error) throw error;
}

async function materializePersonaCvUpload(
    supabase: SupabaseClient,
    personaId: string,
    userId: string,
    input: PersonaCvUploadInput,
) {
    const fileName = sanitizePersonaCvFileName(input.fileName);
    const storagePath = `personas/${personaId}/cv/${randomUUID()}-${fileName}`;

    await materializeDirectUpload({
        destinationPath: storagePath,
        expectedPurpose: CONTENT_UPLOAD_PURPOSES.personaCv,
        reference: {
            bucket: input.storageBucket,
            path: input.storagePath,
            purpose: CONTENT_UPLOAD_PURPOSES.personaCv,
        },
        supabase,
        userId,
    });

    const bucket = supabase.storage.from(PERSONA_CV_UPLOAD_BUCKET);
    const { data: fileInfo, error: fileInfoError } = await bucket.info(storagePath);
    const validationMessage = fileInfo
        ? validateContentUploadFile(
            {
                name: fileName,
                size: fileInfo.size ?? 0,
                type: fileInfo.contentType ?? "",
            },
            CONTENT_UPLOAD_PURPOSES.personaCv,
        )
        : "Le CV uploadé est introuvable.";

    if (fileInfoError || validationMessage) {
        await bucket.remove([storagePath]).catch(() => undefined);
        throw new AppError(
            validationMessage || "Le CV uploadé est introuvable.",
            400,
            "PERSONA_CV_UPLOAD_INVALID",
        );
    }

    const { data: fileBody, error: downloadError } = await bucket.download(storagePath);
    const hasPdfSignature = fileBody
        ? hasPdfFileSignature(new Uint8Array(await fileBody.slice(0, 5).arrayBuffer()))
        : false;

    if (downloadError || !hasPdfSignature) {
        await bucket.remove([storagePath]).catch(() => undefined);
        throw new AppError(
            "Le contenu du CV n'est pas un PDF valide.",
            400,
            "PERSONA_CV_CONTENT_INVALID",
        );
    }

    return {
        fileName,
        mimeType: fileInfo.contentType ?? PERSONA_CV_UPLOAD_MIME_TYPE,
        sizeBytes: fileInfo.size ?? 0,
        storagePath,
    };
}

export interface PreparedPersonaCvUpdate {
    finalize: () => Promise<void>;
    rollback: () => Promise<void>;
    summary: PersonaCvSummary | null | undefined;
}

const NOOP_PERSONA_CV_UPDATE: PreparedPersonaCvUpdate = {
    finalize: async () => undefined,
    rollback: async () => undefined,
    summary: undefined,
};

function toPersonaCvPersistence(row: PersonaCvRow) {
    return {
        file_name: row.file_name,
        mime_type: row.mime_type,
        persona_id: row.persona_id,
        size_bytes: row.size_bytes,
        storage_path: row.storage_path,
        uploaded_by: row.uploaded_by,
    };
}

async function upsertPersonaCvRow(supabase: SupabaseClient, row: ReturnType<typeof toPersonaCvPersistence>) {
    const { data, error } = await supabase
        .from("persona_cv_documents")
        .upsert(row, { onConflict: "persona_id" })
        .select(PERSONA_CV_SELECT)
        .single<PersonaCvRow>();

    if (error) throw error;
    return data;
}

async function deletePersonaCvRow(supabase: SupabaseClient, personaId: string) {
    const { error } = await supabase
        .from("persona_cv_documents")
        .delete()
        .eq("persona_id", personaId);

    if (error) throw error;
}

async function finalizePersonaCvStorageRemoval(
    supabase: SupabaseClient,
    personaId: string,
    storagePath: string,
) {
    await removePersonaCvStorageObject(supabase, personaId, storagePath).catch((cleanupError) => {
        console.error("Unable to remove previous persona CV:", cleanupError);
    });
}

export async function preparePersonaCvUpdate(
    supabase: SupabaseClient,
    personaId: string,
    userId: string,
    input: PersonaCvInput | null | undefined,
): Promise<PreparedPersonaCvUpdate> {
    if (input === undefined || input?.kind === "existing") {
        return NOOP_PERSONA_CV_UPDATE;
    }

    const existingCv = await getPersonaCvRow(supabase, personaId);

    if (input === null) {
        if (!existingCv) return NOOP_PERSONA_CV_UPDATE;
        if (!isOwnedPersonaCvPath(existingCv.storage_path, personaId)) {
            throw new AppError("Chemin du CV invalide.", 500, "PERSONA_CV_PATH_INVALID");
        }

        await deletePersonaCvRow(supabase, personaId);
        return {
            finalize: () => finalizePersonaCvStorageRemoval(supabase, personaId, existingCv.storage_path),
            rollback: async () => {
                await upsertPersonaCvRow(supabase, toPersonaCvPersistence(existingCv));
            },
            summary: null,
        };
    }

    const uploadedCv = await materializePersonaCvUpload(supabase, personaId, userId, input);
    let persistedCv: PersonaCvRow;

    try {
        persistedCv = await upsertPersonaCvRow(supabase, {
            file_name: uploadedCv.fileName,
            mime_type: uploadedCv.mimeType,
            persona_id: personaId,
            size_bytes: uploadedCv.sizeBytes,
            storage_path: uploadedCv.storagePath,
            uploaded_by: userId,
        });
    } catch (error) {
        await removePersonaCvStorageObject(supabase, personaId, uploadedCv.storagePath).catch(() => undefined);
        throw error;
    }

    return {
        finalize: async () => {
            if (existingCv) {
                await finalizePersonaCvStorageRemoval(supabase, personaId, existingCv.storage_path);
            }
        },
        rollback: async () => {
            if (existingCv) {
                await upsertPersonaCvRow(supabase, toPersonaCvPersistence(existingCv));
            } else {
                await deletePersonaCvRow(supabase, personaId);
            }
            await removePersonaCvStorageObject(supabase, personaId, uploadedCv.storagePath);
        },
        summary: mapPersonaCvRowToSummary(persistedCv),
    };
}

export async function createPersonaCv(
    supabase: SupabaseClient,
    personaId: string,
    userId: string,
    input: PersonaCvInput | null | undefined,
) {
    if (input === null || input === undefined) return null;

    if (input.kind !== "upload") {
        throw new AppError(
            "Un CV existant ne peut pas être attribué à un nouveau persona.",
            400,
            "PERSONA_CV_INVALID",
        );
    }

    const preparedUpdate = await preparePersonaCvUpdate(supabase, personaId, userId, input);
    await preparedUpdate.finalize();
    return preparedUpdate.summary;
}

export async function getPersonaCvSummary(personaId: string): Promise<PersonaCvSummary | null> {
    await requireAdmin();
    const row = await getPersonaCvRow(createAdminClient(), personaId);
    return row ? mapPersonaCvRowToSummary(row) : null;
}

export async function getPersonaCvAccess(personaId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const row = await getPersonaCvRow(adminSupabase, personaId);

    if (!row || !isOwnedPersonaCvPath(row.storage_path, personaId)) {
        throw new NotFoundError("CV du persona introuvable.");
    }

    const { data, error } = await adminSupabase.storage
        .from(PERSONA_CV_UPLOAD_BUCKET)
        .createSignedUrl(row.storage_path, PERSONA_CV_SIGNED_URL_TTL_SECONDS, {
            download: row.file_name,
        });

    if (error) throw error;
    if (!data?.signedUrl) throw new NotFoundError("CV du persona introuvable.");

    return { url: assertHttpUrl(data.signedUrl) };
}
