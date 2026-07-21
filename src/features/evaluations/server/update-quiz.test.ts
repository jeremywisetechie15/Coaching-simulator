import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";

const mocks = vi.hoisted(() => ({
    assertQuizLifecycle: vi.fn(),
    fetchQuizDetail: vi.fn(),
    materializeQuizAttachments: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAdmin: vi.fn().mockResolvedValue({ userId: "admin-1" }),
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: () => ({
        from: () => {
            const query = {
                eq: () => query,
                maybeSingle: vi.fn().mockResolvedValue({
                    data: { id: "quiz-1", status: CONTENT_STATUS.draft },
                    error: null,
                }),
                select: () => query,
            };
            return query;
        },
        rpc: mocks.rpc,
    }),
}));
vi.mock("./assert-quiz-lifecycle", () => ({ assertQuizLifecycle: mocks.assertQuizLifecycle }));
vi.mock("./quiz-query", () => ({ fetchQuizDetail: mocks.fetchQuizDetail }));
vi.mock("./save-quiz-children", async (importOriginal) => {
    const original = await importOriginal<typeof import("./save-quiz-children")>();
    return {
        ...original,
        materializeQuizAttachments: mocks.materializeQuizAttachments,
    };
});

import { updateQuiz } from "./update-quiz";

const stepId = "11111111-1111-4111-8111-111111111111";
const questionId = "22222222-2222-4222-8222-222222222222";
const choiceId = "33333333-3333-4333-8333-333333333333";
const attachmentId = "44444444-4444-4444-8444-444444444444";

function quizInput(): SaveQuizDto {
    return {
        assignedUserId: null,
        categories: ["Prospection"],
        description: "Description",
        domain: "Commercial",
        durationMinutes: 10,
        groupId: null,
        maxAttempts: 2,
        methodId: null,
        organizationId: null,
        participation: "optional",
        quizKind: "contextual",
        quizType: "knowledge",
        scope: CONTENT_VISIBILITY_SCOPE.public,
        status: CONTENT_STATUS.draft,
        steps: [{
            competenceIds: [],
            id: stepId,
            methodStepId: null,
            name: "Étape 1",
            questions: [{
                attachments: [{
                    clientFileId: "",
                    externalUrl: "https://example.com/guide.pdf",
                    id: attachmentId,
                    label: "Guide",
                    storageBucket: "",
                    storagePath: "",
                    type: "document",
                }],
                choices: [{ id: choiceId, isCorrect: true, label: "Oui" }],
                competenceId: "",
                dimension: "savoir",
                dimensionItem: "",
                dimensionItemId: null,
                explanation: "",
                id: questionId,
                points: 1,
                prompt: "Question ?",
                type: "QCU",
            }],
            weight: 100,
        }],
        tags: [],
        title: "Quiz",
        validationThreshold: 70,
    };
}

describe("updateQuiz", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.rpc.mockResolvedValue({ error: null });
        mocks.fetchQuizDetail.mockResolvedValue({ id: "quiz-1" });
        mocks.materializeQuizAttachments.mockImplementation(async (_client, _id, input) => input);
    });

    it("preserves existing aggregate IDs sent by the edit form", async () => {
        await updateQuiz("quiz-1", quizInput());

        expect(mocks.rpc).toHaveBeenCalledWith("admin_update_quiz_aggregate", expect.objectContaining({
            p_attachments: [expect.objectContaining({ id: attachmentId, question_id: questionId })],
            p_choices: [expect.objectContaining({ id: choiceId, question_id: questionId })],
            p_questions: [expect.objectContaining({ id: questionId, step_id: stepId })],
            p_steps: [expect.objectContaining({ id: stepId })],
        }));
    });

    it("persists and returns the edited title", async () => {
        const input = quizInput();
        input.title = "Nouveau titre du quiz";
        mocks.fetchQuizDetail.mockResolvedValue({
            id: "quiz-1",
            title: "Nouveau titre du quiz",
        });

        const result = await updateQuiz("quiz-1", input);

        expect(mocks.rpc).toHaveBeenCalledWith(
            "admin_update_quiz_aggregate",
            expect.objectContaining({
                p_quiz: expect.objectContaining({ title: "Nouveau titre du quiz" }),
            }),
        );
        expect(result).toMatchObject({
            id: "quiz-1",
            title: "Nouveau titre du quiz",
        });
    });
});
