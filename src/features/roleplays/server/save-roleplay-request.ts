import type { NextRequest } from "next/server";
import { saveRoleplayDto, type SaveRoleplayDto } from "@/features/roleplays/dto";
import { AppError } from "@/lib/server/errors";
import type { RoleplayUploadFilesByClientId } from "./roleplay-upload-files";

export interface ParsedSaveRoleplayRequest {
    input: SaveRoleplayDto;
    uploadFilesByClientId: RoleplayUploadFilesByClientId;
}

function parseMultipartPayload(payload: FormDataEntryValue | null) {
    if (typeof payload !== "string") {
        throw new AppError("Payload roleplay manquant.", 400, "ROLEPLAY_PAYLOAD_REQUIRED");
    }

    try {
        return JSON.parse(payload) as unknown;
    } catch {
        throw new AppError("Payload roleplay invalide.", 400, "ROLEPLAY_PAYLOAD_INVALID");
    }
}

export async function parseSaveRoleplayRequest(request: NextRequest): Promise<ParsedSaveRoleplayRequest> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return {
            input: saveRoleplayDto.parse(await request.json()),
            uploadFilesByClientId: new Map(),
        };
    }

    const formData = await request.formData();
    const payload = parseMultipartPayload(formData.get("payload"));
    const uploadFilesByClientId: RoleplayUploadFilesByClientId = new Map();

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith("file:")) continue;
        if (!(value instanceof File)) continue;

        const clientFileId = key.slice("file:".length);
        if (clientFileId) {
            uploadFilesByClientId.set(clientFileId, value);
        }
    }

    return {
        input: saveRoleplayDto.parse(payload),
        uploadFilesByClientId,
    };
}
