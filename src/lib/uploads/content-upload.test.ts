import { describe, expect, it } from "vitest";
import {
    CONTENT_UPLOAD_BUCKET,
    CONTENT_UPLOAD_PURPOSES,
    MAX_PERSONA_CV_UPLOAD_SIZE_BYTES,
    MAX_VIDEO_UPLOAD_SIZE_BYTES,
    PERSONA_CV_UPLOAD_BUCKET,
    PERSONA_CV_UPLOAD_MIME_TYPE,
    QUIZ_UPLOAD_BUCKET,
    SCENARIO_RESOURCE_UPLOAD_BUCKET,
    SESSION_BACKGROUND_UPLOAD_BUCKET,
    formatUploadFileSize,
    getContentUploadAccept,
    hasPdfFileSignature,
    inferContentUploadResourceType,
    getContentUploadLimitLabel,
    getContentUploadSizeErrorMessage,
    sanitizeUploadFileName,
    validateContentUploadFile,
} from "./content-upload";

describe("content upload domain", () => {
    it("validates supported content files", () => {
        expect(CONTENT_UPLOAD_BUCKET).toBe("notation_pdf");
        expect(QUIZ_UPLOAD_BUCKET).toBe("quizzes");
        expect(SCENARIO_RESOURCE_UPLOAD_BUCKET).toBe("resource_scenarios");
        expect(SESSION_BACKGROUND_UPLOAD_BUCKET).toBe("session-backgrounds");
        expect(
            validateContentUploadFile({
                name: "Guide DAGO.pdf",
                size: 1024,
                type: "application/pdf",
            }),
        ).toBeNull();
        expect(inferContentUploadResourceType("application/pdf")).toBe("document");
        expect(inferContentUploadResourceType("audio/mpeg")).toBe("audio");
        expect(inferContentUploadResourceType("image/png")).toBe("image");
        expect(
            validateContentUploadFile(
                {
                    name: "guide.md",
                    size: 1024,
                    type: "text/markdown",
                },
                CONTENT_UPLOAD_PURPOSES.methodDocument,
            ),
        ).toBeNull();
    });

    it("accepts only appropriately sized images for session backgrounds", () => {
        expect(
            validateContentUploadFile(
                { name: "bureau.webp", size: 2 * 1024 * 1024, type: "image/webp" },
                CONTENT_UPLOAD_PURPOSES.sessionBackground,
            ),
        ).toBeNull();
        expect(
            validateContentUploadFile(
                { name: "brief.pdf", size: 1024, type: "application/pdf" },
                CONTENT_UPLOAD_PURPOSES.sessionBackground,
            ),
        ).toBe("Le fond de session accepte uniquement une image JPG, PNG ou WebP.");
        expect(
            validateContentUploadFile(
                { name: "bureau.png", size: 10 * 1024 * 1024 + 1, type: "image/png" },
                CONTENT_UPLOAD_PURPOSES.sessionBackground,
            ),
        ).toBe("L'image de fond ne doit pas dépasser 10 Mo.");
    });

    it("accepts only appropriately sized images for persona avatars", () => {
        expect(
            validateContentUploadFile(
                { name: "persona.jpg", size: 2 * 1024 * 1024, type: "image/jpeg" },
                CONTENT_UPLOAD_PURPOSES.personaAvatar,
            ),
        ).toBeNull();
        expect(
            validateContentUploadFile(
                { name: "persona.pdf", size: 1024, type: "application/pdf" },
                CONTENT_UPLOAD_PURPOSES.personaAvatar,
            ),
        ).toBe("L'avatar du persona accepte uniquement une image JPG, PNG ou WebP.");
        expect(
            validateContentUploadFile(
                { name: "persona.png", size: 10 * 1024 * 1024 + 1, type: "image/png" },
                CONTENT_UPLOAD_PURPOSES.personaAvatar,
            ),
        ).toBe("L'avatar du persona ne doit pas dépasser 10 Mo.");
    });

    it("uses the shared image rules for coach avatars", () => {
        expect(
            validateContentUploadFile(
                { name: "coach.webp", size: 2 * 1024 * 1024, type: "image/webp" },
                CONTENT_UPLOAD_PURPOSES.coachAvatar,
            ),
        ).toBeNull();
        expect(
            validateContentUploadFile(
                { name: "coach.pdf", size: 1024, type: "application/pdf" },
                CONTENT_UPLOAD_PURPOSES.coachAvatar,
            ),
        ).toBe("L'avatar du coach accepte uniquement une image JPG, PNG ou WebP.");
    });

    it("accepts persona CVs only as PDFs up to the shared 5 Mo limit", () => {
        expect(PERSONA_CV_UPLOAD_BUCKET).toBe("personas-cvs");
        expect(getContentUploadAccept(CONTENT_UPLOAD_PURPOSES.personaCv)).toBe(
            PERSONA_CV_UPLOAD_MIME_TYPE,
        );
        expect(getContentUploadLimitLabel(CONTENT_UPLOAD_PURPOSES.personaCv)).toBe(
            "CV au format PDF : 5 Mo maximum.",
        );
        expect(
            validateContentUploadFile(
                {
                    name: "CV-Sophie.PDF",
                    size: MAX_PERSONA_CV_UPLOAD_SIZE_BYTES,
                    type: PERSONA_CV_UPLOAD_MIME_TYPE,
                },
                CONTENT_UPLOAD_PURPOSES.personaCv,
            ),
        ).toBeNull();
        expect(
            validateContentUploadFile(
                {
                    name: "CV-Sophie.docx",
                    size: 1024,
                    type: PERSONA_CV_UPLOAD_MIME_TYPE,
                },
                CONTENT_UPLOAD_PURPOSES.personaCv,
            ),
        ).toBe("Le CV doit être un fichier PDF.");
        expect(
            validateContentUploadFile(
                {
                    name: "CV-Sophie.pdf",
                    size: 1024,
                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                },
                CONTENT_UPLOAD_PURPOSES.personaCv,
            ),
        ).toBe("Le CV doit être un fichier PDF.");
        expect(
            validateContentUploadFile(
                {
                    name: "CV-Sophie.pdf",
                    size: MAX_PERSONA_CV_UPLOAD_SIZE_BYTES + 1,
                    type: PERSONA_CV_UPLOAD_MIME_TYPE,
                },
                CONTENT_UPLOAD_PURPOSES.personaCv,
            ),
        ).toBe("Le CV ne doit pas dépasser 5 Mo.");
        expect(
            validateContentUploadFile(
                {
                    name: "CV-Sophie.pdf",
                    size: 0,
                    type: PERSONA_CV_UPLOAD_MIME_TYPE,
                },
                CONTENT_UPLOAD_PURPOSES.personaCv,
            ),
        ).toBe("Le fichier est vide.");
    });

    it("recognizes the PDF file signature instead of trusting metadata alone", () => {
        expect(hasPdfFileSignature(new TextEncoder().encode("%PDF-1.7"))).toBe(true);
        expect(hasPdfFileSignature(new TextEncoder().encode("<html>"))).toBe(false);
        expect(hasPdfFileSignature(new Uint8Array())).toBe(false);
    });

    it("rejects unsupported or oversized files", () => {
        expect(
            validateContentUploadFile({
                name: "archive.zip",
                size: 1024,
                type: "application/zip",
            }),
        ).toBe("Format de fichier non supporté.");

        expect(
            validateContentUploadFile({
                name: "video.mp4",
                size: MAX_VIDEO_UPLOAD_SIZE_BYTES,
                type: "video/mp4",
            }),
        ).toBeNull();

        expect(
            validateContentUploadFile({
                name: "video.mp4",
                size: MAX_VIDEO_UPLOAD_SIZE_BYTES + 1,
                type: "video/mp4",
            }),
        ).toBe(
            "La vidéo dépasse 50 Mo, la limite actuelle. Compressez-la ou utilisez une URL YouTube/Vimeo.",
        );

        expect(
            validateContentUploadFile(
                {
                    name: "video.mp4",
                    size: 1024,
                    type: "video/mp4",
                },
                CONTENT_UPLOAD_PURPOSES.methodDocument,
            ),
        ).toBe("Les ressources complémentaires acceptent uniquement des documents.");

        expect(
            validateContentUploadFile(
                {
                    name: "audio.mp3",
                    size: 1024,
                    type: "audio/mpeg",
                },
                CONTENT_UPLOAD_PURPOSES.quizAttachment,
            ),
        ).toBeNull();

        expect(
            validateContentUploadFile(
                {
                    name: "demo.mp4",
                    size: MAX_VIDEO_UPLOAD_SIZE_BYTES,
                    type: "video/mp4",
                },
                CONTENT_UPLOAD_PURPOSES.scenarioResource,
            ),
        ).toBeNull();

        expect(
            validateContentUploadFile(
                {
                    name: "demo.mp4",
                    size: MAX_VIDEO_UPLOAD_SIZE_BYTES,
                    type: "video/mp4",
                },
                CONTENT_UPLOAD_PURPOSES.quizAttachment,
            ),
        ).toBeNull();

        expect(
            validateContentUploadFile(
                {
                    name: "demo.mp4",
                    size: MAX_VIDEO_UPLOAD_SIZE_BYTES + 1,
                    type: "video/mp4",
                },
                CONTENT_UPLOAD_PURPOSES.quizAttachment,
            ),
        ).toBe(
            "La vidéo dépasse 50 Mo, la limite actuelle. Compressez-la ou utilisez une URL YouTube/Vimeo.",
        );

        expect(
            getContentUploadSizeErrorMessage(
                { type: "video/mp4" },
                CONTENT_UPLOAD_PURPOSES.contentAsset,
            ),
        ).toBe(
            "La vidéo dépasse 50 Mo, la limite actuelle. Compressez-la ou utilisez une URL YouTube/Vimeo.",
        );
    });

    it("normalizes file names and sizes for display", () => {
        expect(sanitizeUploadFileName("Guide DAGO final.pdf", "application/pdf")).toBe("guide-dago-final.pdf");
        expect(sanitizeUploadFileName("évaluation commerciale", "text/plain")).toBe("evaluation-commerciale.txt");
        expect(formatUploadFileSize(1536)).toBe("2 Ko");
        expect(formatUploadFileSize(2.5 * 1024 * 1024)).toBe("2.5 Mo");
    });

    it("exposes upload limits from the same validation SSOT", () => {
        expect(getContentUploadLimitLabel()).toBe(
            "Vidéos : 50 Mo maximum. Autres fichiers : 25 Mo maximum.",
        );
        expect(getContentUploadLimitLabel(CONTENT_UPLOAD_PURPOSES.methodDocument)).toBe(
            "Documents : 25 Mo maximum.",
        );
        expect(getContentUploadLimitLabel(CONTENT_UPLOAD_PURPOSES.personaAvatar)).toBe(
            "Images JPG, PNG ou WebP : 10 Mo maximum.",
        );
    });
});
