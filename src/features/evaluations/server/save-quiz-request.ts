import type { NextRequest } from "next/server";
import { saveQuizDto, type SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { AppError } from "@/lib/server/errors";
import type { QuizUploadFilesByClientId } from "./quiz-upload-files";

export interface ParsedSaveQuizRequest {
    input: SaveQuizDto;
    uploadFilesByClientId: QuizUploadFilesByClientId;
}

function parseMultipartPayload(payload: FormDataEntryValue | null) {
    if (typeof payload !== "string") {
        throw new AppError("Payload quiz manquant.", 400, "QUIZ_PAYLOAD_REQUIRED");
    }

    try {
        return JSON.parse(payload) as unknown;
    } catch {
        throw new AppError("Payload quiz invalide.", 400, "QUIZ_PAYLOAD_INVALID");
    }
}

export async function parseSaveQuizRequest(request: NextRequest): Promise<ParsedSaveQuizRequest> {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return {
            input: saveQuizDto.parse(await request.json()),
            uploadFilesByClientId: new Map(),
        };
    }

    const formData = await request.formData();
    const payload = parseMultipartPayload(formData.get("payload"));
    const uploadFilesByClientId: QuizUploadFilesByClientId = new Map();

    for (const [key, value] of formData.entries()) {
        if (!key.startsWith("file:")) continue;
        if (!(value instanceof File)) continue;

        const clientFileId = key.slice("file:".length);
        if (clientFileId) {
            uploadFilesByClientId.set(clientFileId, value);
        }
    }

    return {
        input: saveQuizDto.parse(payload),
        uploadFilesByClientId,
    };
}
