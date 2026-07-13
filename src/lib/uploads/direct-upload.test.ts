import { describe, expect, it } from "vitest";
import { CONTENT_UPLOAD_PURPOSES } from "./content-upload";
import {
    applyDirectUploadReferences,
    buildDirectStorageEndpoint,
    getDirectUploadBucket,
    getDirectUploadStagingPrefix,
    isOwnedDirectUploadReference,
} from "./direct-upload";

describe("direct upload domain", () => {
    it("maps each purpose to its SSOT bucket", () => {
        expect(getDirectUploadBucket(CONTENT_UPLOAD_PURPOSES.contentAsset)).toBe("notation_pdf");
        expect(getDirectUploadBucket(CONTENT_UPLOAD_PURPOSES.methodDocument)).toBe("notation_pdf");
        expect(getDirectUploadBucket(CONTENT_UPLOAD_PURPOSES.quizAttachment)).toBe("quizzes");
        expect(getDirectUploadBucket(CONTENT_UPLOAD_PURPOSES.scenarioResource)).toBe("resource_scenarios");
    });

    it("builds the direct Supabase Storage TUS endpoint", () => {
        expect(buildDirectStorageEndpoint("https://project-ref.supabase.co")).toBe(
            "https://project-ref.storage.supabase.co/storage/v1/upload/resumable",
        );
        expect(buildDirectStorageEndpoint("http://127.0.0.1:54321")).toBe(
            "http://127.0.0.1:54321/storage/v1/upload/resumable",
        );
    });

    it("only accepts staging references owned by the current user and purpose", () => {
        const userId = "11111111-1111-4111-8111-111111111111";
        const path = `${getDirectUploadStagingPrefix(userId, CONTENT_UPLOAD_PURPOSES.quizAttachment)}upload/file.mp4`;
        const reference = {
            bucket: "quizzes",
            path,
            purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
        } as const;

        expect(isOwnedDirectUploadReference(reference, userId)).toBe(true);
        expect(isOwnedDirectUploadReference(reference, "22222222-2222-4222-8222-222222222222")).toBe(false);
        expect(
            isOwnedDirectUploadReference(reference, userId, CONTENT_UPLOAD_PURPOSES.scenarioResource),
        ).toBe(false);
    });

    it("injects uploaded storage references without changing unrelated values", () => {
        const payload = {
            name: "Quiz",
            steps: [
                {
                    questions: [
                        {
                            attachments: [
                                {
                                    clientFileId: "file-1",
                                    label: "Vidéo",
                                    storageBucket: "",
                                    storagePath: "",
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        const result = applyDirectUploadReferences(
            payload,
            new Map([
                [
                    "file-1",
                    {
                        bucket: "quizzes",
                        path: "_staging/user/quiz_attachment/upload/video.mp4",
                        purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                    },
                ],
            ]),
        );

        expect(result).not.toBe(payload);
        expect(result.steps[0].questions[0].attachments[0]).toEqual({
            clientFileId: "file-1",
            label: "Vidéo",
            storageBucket: "quizzes",
            storagePath: "_staging/user/quiz_attachment/upload/video.mp4",
        });
        expect(payload.steps[0].questions[0].attachments[0].storagePath).toBe("");
    });
});
