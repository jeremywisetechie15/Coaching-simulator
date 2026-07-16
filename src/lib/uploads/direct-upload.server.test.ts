import { describe, expect, it } from "vitest";
import { CONTENT_UPLOAD_PURPOSES } from "./content-upload";
import { materializeDirectUpload } from "./direct-upload.server";

describe("direct upload materialization", () => {
    it("moves an owned staging object to its final business path", async () => {
        const moves: Array<{ bucket: string; destination: string; source: string }> = [];
        const supabase = {
            storage: {
                from(bucket: string) {
                    return {
                        async info() {
                            return {
                                data: { contentType: "video/mp4", size: 1024 },
                                error: null,
                            };
                        },
                        async move(source: string, destination: string) {
                            moves.push({ bucket, destination, source });
                            return { error: null };
                        },
                    };
                },
            },
        };
        const userId = "11111111-1111-4111-8111-111111111111";
        const source = `_staging/${userId}/quiz_attachment/upload/video.mp4`;
        const destination = "quizzes/quiz-1/questions/question-1/attachments/attachment-1/video.mp4";

        await expect(
            materializeDirectUpload({
                destinationPath: destination,
                expectedPurpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                reference: {
                    bucket: "quizzes",
                    path: source,
                    purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                },
                supabase: supabase as never,
                userId,
            }),
        ).resolves.toEqual({ bucket: "quizzes", path: destination });
        expect(moves).toEqual([{ bucket: "quizzes", destination, source }]);
    });

    it("rejects a staging object owned by another user", async () => {
        const supabase = {
            storage: {
                from() {
                    return {
                        info: () => Promise.resolve({ data: { contentType: "video/mp4", size: 1024 }, error: null }),
                        move: () => Promise.resolve({ error: null }),
                    };
                },
            },
        };

        await expect(
            materializeDirectUpload({
                destinationPath: "quizzes/quiz-1/video.mp4",
                expectedPurpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                reference: {
                    bucket: "quizzes",
                    path: "_staging/another-user/quiz_attachment/upload/video.mp4",
                    purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                },
                supabase: supabase as never,
                userId: "11111111-1111-4111-8111-111111111111",
            }),
        ).rejects.toMatchObject({ code: "INVALID_DIRECT_UPLOAD_REFERENCE", status: 400 });
    });

    it("revalidates the stored persona CV before moving it", async () => {
        let moveCalled = false;
        const supabase = {
            storage: {
                from() {
                    return {
                        info: () => Promise.resolve({
                            data: { contentType: "image/png", size: 1024 },
                            error: null,
                        }),
                        move: () => {
                            moveCalled = true;
                            return Promise.resolve({ error: null });
                        },
                    };
                },
            },
        };
        const userId = "11111111-1111-4111-8111-111111111111";

        await expect(
            materializeDirectUpload({
                destinationPath: "personas/persona-1/cv/cv.pdf",
                expectedPurpose: CONTENT_UPLOAD_PURPOSES.personaCv,
                reference: {
                    bucket: "personas-cvs",
                    path: `_staging/${userId}/persona_cv/upload/cv.pdf`,
                    purpose: CONTENT_UPLOAD_PURPOSES.personaCv,
                },
                supabase: supabase as never,
                userId,
            }),
        ).rejects.toMatchObject({ code: "INVALID_DIRECT_UPLOAD_FILE", status: 400 });
        expect(moveCalled).toBe(false);
    });
});
