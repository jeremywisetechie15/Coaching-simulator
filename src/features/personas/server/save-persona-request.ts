import type { NextRequest } from "next/server";
import {
    savePersonaDto,
    type SavePersonaDto,
} from "@/features/personas/dto/save-persona.dto";
import { AppError } from "@/lib/server/errors";

export interface ParsedSavePersonaRequest {
    avatarFile: File | null;
    input: SavePersonaDto;
}

function parsePayload(value: FormDataEntryValue | null) {
    if (typeof value !== "string") {
        throw new AppError("Payload persona manquant.", 400, "PERSONA_PAYLOAD_REQUIRED");
    }

    try {
        return JSON.parse(value) as unknown;
    } catch {
        throw new AppError("Payload persona invalide.", 400, "PERSONA_PAYLOAD_INVALID");
    }
}

export async function parseSavePersonaRequest(
    request: NextRequest,
): Promise<ParsedSavePersonaRequest> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return { avatarFile: null, input: savePersonaDto.parse(await request.json()) };
    }

    const formData = await request.formData();
    const avatarEntry = formData.get("avatarFile");

    return {
        avatarFile: avatarEntry instanceof File ? avatarEntry : null,
        input: savePersonaDto.parse(parsePayload(formData.get("payload"))),
    };
}
