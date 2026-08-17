import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEARNER_CONTENT_STATUS } from "@/features/content/domain";
import type { QuizDetail } from "@/features/evaluations/domain";
import { QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE } from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";

const mocks = vi.hoisted(() => ({
    fetchQuizDetail: vi.fn(),
}));

vi.mock("./quiz-query", () => ({
    fetchQuizDetail: mocks.fetchQuizDetail,
}));

import { assertQuizAttemptEditPolicy } from "./quiz-attempt-edit-policy";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{
    count: number | null;
    data: null;
    error: null;
}> {
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select() {
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    then<TResult1 = {
        count: number | null;
        data: null;
        error: null;
    }, TResult2 = never>(
        onfulfilled?: ((value: {
            count: number | null;
            data: null;
            error: null;
        }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        const count = this.rows.filter((row) =>
            this.filters.every((filter) => filter(row))
        ).length;

        return Promise.resolve({
            count,
            data: null,
            error: null,
        } as const).then(onfulfilled, onrejected);
    }
}

function createFakeSupabase(hasAttempts: boolean) {
    const attempts = hasAttempts
        ? [{ id: "attempt-1", quiz_id: "quiz-1" }]
        : [];

    return {
        from: () => new FakeQuery(attempts),
    };
}

const stepId = "11111111-1111-4111-8111-111111111111";
const questionId = "22222222-2222-4222-8222-222222222222";
const choiceOneId = "33333333-3333-4333-8333-333333333333";
const choiceTwoId = "44444444-4444-4444-8444-444444444444";
const attachmentId = "55555555-5555-4555-8555-555555555555";
const skillId = "66666666-6666-4666-8666-666666666666";
const dimensionItemId = "77777777-7777-4777-8777-777777777777";

function currentQuiz(): QuizDetail {
    return {
        assignedUserId: null,
        categories: ["Prospection"],
        createdAt: null,
        description: "Description initiale",
        difficulty: "Moyen",
        domain: "Commerce et développement commercial",
        durationMinutes: 10,
        groupId: null,
        id: "quiz-1",
        isActive: true,
        kind: "contextual",
        learnerStats: {
            attemptCount: 0,
            bestScore: null,
            currentScore: null,
            indexResultCount: 0,
            indexScore: null,
        },
        learnerStatus: LEARNER_CONTENT_STATUS.todo,
        maxAttempts: 3,
        methodId: null,
        methodName: null,
        organizationId: null,
        participation: "optional",
        questionCount: 1,
        scope: "public",
        status: "published",
        steps: [{
            competenceIds: [skillId],
            id: stepId,
            methodStepId: null,
            name: "Étape initiale",
            order: 1,
            questions: [{
                attachments: [{
                    externalUrl: "https://example.com/guide",
                    id: attachmentId,
                    label: "Guide initial",
                    order: 1,
                    storageBucket: null,
                    storagePath: null,
                    type: "link",
                }],
                choices: [
                    { id: choiceOneId, isCorrect: true, label: "Oui", order: 1 },
                    { id: choiceTwoId, isCorrect: false, label: "Non", order: 2 },
                ],
                competenceId: skillId,
                dimension: "savoir",
                dimensionItem: "Argumenter",
                dimensionItemId,
                explanation: "Explication initiale",
                id: questionId,
                order: 1,
                points: 1,
                prompt: "Question initiale ?",
                type: "QCU",
            }],
            weight: 100,
        }],
        tags: ["initial"],
        title: "Quiz initial",
        type: "knowledge",
        updatedAt: null,
        validationThreshold: 70,
    };
}

function unchangedInput(): SaveQuizDto {
    return {
        assignedUserId: null,
        categories: ["Prospection"],
        description: "Description initiale",
        difficulty: "Moyen",
        domain: "Commerce et développement commercial",
        durationMinutes: 10,
        groupId: null,
        maxAttempts: 3,
        methodId: null,
        organizationId: null,
        participation: "optional",
        quizKind: "contextual",
        quizType: "knowledge",
        scope: "public",
        status: "published",
        steps: [{
            competenceIds: [skillId],
            id: stepId,
            methodStepId: null,
            name: "Étape initiale",
            questions: [{
                attachments: [{
                    clientFileId: "",
                    externalUrl: "https://example.com/guide",
                    id: attachmentId,
                    label: "Guide initial",
                    storageBucket: "",
                    storagePath: "",
                    type: "link",
                }],
                choices: [
                    { id: choiceOneId, isCorrect: true, label: "Oui" },
                    { id: choiceTwoId, isCorrect: false, label: "Non" },
                ],
                competenceId: skillId,
                dimension: "savoir",
                dimensionItem: "Argumenter",
                dimensionItemId,
                explanation: "Explication initiale",
                id: questionId,
                points: 1,
                prompt: "Question initiale ?",
                type: "QCU",
            }],
            weight: 100,
        }],
        tags: ["initial"],
        title: "Quiz initial",
        validationThreshold: 70,
    };
}

describe("quiz attempt edit policy server guard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.fetchQuizDetail.mockResolvedValue(currentQuiz());
    });

    it("allows existing text and numeric values to change after an attempt", async () => {
        const input = unchangedInput();
        input.title = "Nouveau titre";
        input.description = "Nouvelle description";
        input.durationMinutes = 20;
        input.maxAttempts = 5;
        input.validationThreshold = 80;
        input.tags = ["modifié"];
        input.steps[0]!.name = "Nouvelle étape";
        input.steps[0]!.weight = 60;
        input.steps[0]!.questions[0]!.prompt = "Nouvelle question ?";
        input.steps[0]!.questions[0]!.points = 4;
        input.steps[0]!.questions[0]!.explanation = "Nouvelle explication";
        input.steps[0]!.questions[0]!.choices[0]!.label = "Réponse reformulée";
        input.steps[0]!.questions[0]!.attachments[0]!.label = "Nouveau guide";
        input.steps[0]!.questions[0]!.attachments[0]!.externalUrl = "https://example.com/nouveau";

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).resolves.toBeUndefined();
    });

    it("allows difficulty metadata to change after an attempt", async () => {
        const input = unchangedInput();
        input.difficulty = "Difficile";

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).resolves.toBeUndefined();
    });

    it("allows method usage and step mappings to be corrected after an attempt", async () => {
        const input = unchangedInput();
        input.quizKind = "method_knowledge";
        input.methodId = "88888888-8888-4888-8888-888888888888";
        input.steps[0]!.methodStepId = "99999999-9999-4999-8999-999999999999";

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).resolves.toBeUndefined();
    });

    it("keeps the quiz type locked after an attempt", async () => {
        const input = unchangedInput();
        input.quizType = "self_assessment";

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).rejects.toMatchObject({
            message: QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("keeps correct answers locked after an attempt", async () => {
        const input = unchangedInput();
        input.steps[0]!.questions[0]!.choices[0]!.isCorrect = false;

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).rejects.toMatchObject({
            message: QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("rejects changing the number of questions after an attempt", async () => {
        const input = unchangedInput();
        input.steps[0]!.questions = [];

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                input,
            ),
        ).rejects.toMatchObject({
            message: QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("rejects a new upload after an attempt", async () => {
        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(true) as never,
                "quiz-1",
                unchangedInput(),
                { hasUploads: true },
            ),
        ).rejects.toMatchObject({
            message: QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE,
            status: 409,
        });
    });

    it("allows every change before the first attempt", async () => {
        const input = unchangedInput();
        input.steps = [];

        await expect(
            assertQuizAttemptEditPolicy(
                createFakeSupabase(false) as never,
                "quiz-1",
                input,
                { hasUploads: true },
            ),
        ).resolves.toBeUndefined();
        expect(mocks.fetchQuizDetail).not.toHaveBeenCalled();
    });
});
