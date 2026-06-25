import type { NextRequest } from "next/server";
import { saveMethodDto, type SaveMethodDto } from "@/features/methods/dto/save-method.dto";
import { AppError } from "@/lib/server/errors";
import type { MethodUploadFilesByClientId } from "./method-upload-files";

export interface ParsedSaveMethodRequest {
    input: SaveMethodDto;
    uploadFilesByClientId: MethodUploadFilesByClientId;
}

function parseMultipartPayload(payload: FormDataEntryValue | null) {
    if (typeof payload !== "string") {
        throw new AppError("Payload méthode manquant.", 400, "METHOD_PAYLOAD_REQUIRED");
    }

    try {
        return JSON.parse(payload) as unknown;
    } catch {
        throw new AppError("Payload méthode invalide.", 400, "METHOD_PAYLOAD_INVALID");
    }
}

export async function parseSaveMethodRequest(request: NextRequest): Promise<ParsedSaveMethodRequest> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return {
            input: saveMethodDto.parse(await request.json()),
            uploadFilesByClientId: new Map(),
        };
    }

    const formData = await request.formData();
    const payload = parseMultipartPayload(formData.get("payload"));
    const uploadFilesByClientId: MethodUploadFilesByClientId = new Map();

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith("file:")) continue;
        if (!(value instanceof File)) continue;

        const clientFileId = key.slice("file:".length);
        if (clientFileId) {
            uploadFilesByClientId.set(clientFileId, value);
        }
    }

    return {
        input: saveMethodDto.parse(payload),
        uploadFilesByClientId,
    };
}
