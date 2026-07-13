import type { NextRequest } from "next/server";
import { saveCoachDto, type SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { AppError } from "@/lib/server/errors";

export interface ParsedSaveCoachRequest {
    avatarFile: File | null;
    backgroundFile: File | null;
    input: SaveCoachDto;
}

function parsePayload(value: FormDataEntryValue | null) {
    if (typeof value !== "string") {
        throw new AppError("Payload coach manquant.", 400, "COACH_PAYLOAD_REQUIRED");
    }

    try {
        return JSON.parse(value) as unknown;
    } catch {
        throw new AppError("Payload coach invalide.", 400, "COACH_PAYLOAD_INVALID");
    }
}

export async function parseSaveCoachRequest(request: NextRequest): Promise<ParsedSaveCoachRequest> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return {
            avatarFile: null,
            backgroundFile: null,
            input: saveCoachDto.parse(await request.json()),
        };
    }

    const formData = await request.formData();
    const avatarEntry = formData.get("avatarFile");
    const backgroundEntry = formData.get("backgroundFile");

    return {
        avatarFile: avatarEntry instanceof File ? avatarEntry : null,
        backgroundFile: backgroundEntry instanceof File ? backgroundEntry : null,
        input: saveCoachDto.parse(parsePayload(formData.get("payload"))),
    };
}
