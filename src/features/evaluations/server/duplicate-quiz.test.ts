import { describe, expect, it } from "vitest";
import { LEARNER_CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND, type QuizDetail } from "@/features/evaluations/domain";
import { buildDuplicateQuizInput } from "./duplicate-quiz";

function sourceQuiz(): QuizDetail {
    return {
        assignedUserId: null,
        categories: ["Prospection"],
        createdAt: "2026-08-01T10:00:00.000Z",
        description: "Valide la méthode.",
        difficulty: "Moyen",
        domain: "Commerce et développement commercial",
        durationMinutes: 15,
        groupId: null,
        id: "quiz-source",
        isActive: true,
        kind: QUIZ_KIND.methodKnowledge,
        learnerStats: {
            attemptCount: 0,
            bestScore: null,
            currentScore: null,
            indexResultCount: 0,
            indexScore: null,
        },
        learnerStatus: LEARNER_CONTENT_STATUS.todo,
        maxAttempts: 3,
        methodId: "method-source",
        methodName: "Méthode source",
        organizationId: "organization-1",
        participation: "mandatory",
        questionCount: 1,
        scope: "organization",
        status: "published",
        steps: [{
            competenceIds: ["skill-1"],
            id: "quiz-step-1",
            methodStepId: "method-step-source",
            name: "Découverte",
            order: 1,
            questions: [{
                attachments: [{
                    externalUrl: "https://example.com/guide",
                    id: "attachment-1",
                    label: "Guide",
                    order: 1,
                    storageBucket: null,
                    storagePath: null,
                    type: "link",
                }],
                choices: [
                    { id: "choice-1", isCorrect: true, label: "Oui", order: 1 },
                    { id: "choice-2", isCorrect: false, label: "Non", order: 2 },
                ],
                competenceId: "skill-1",
                dimension: "savoir",
                dimensionItem: "Questionner",
                dimensionItemId: null,
                explanation: "Explication",
                id: "question-1",
                order: 1,
                points: 2,
                prompt: "Quelle question poser ?",
                type: "QCU",
            }],
            weight: 100,
        }],
        tags: ["vente"],
        title: "Quiz source",
        type: "knowledge",
        updatedAt: "2026-08-01T10:00:00.000Z",
        validationThreshold: 80,
    };
}

describe("buildDuplicateQuizInput", () => {
    it("clones a method quiz independently and remaps its optional method step links", () => {
        const input = buildDuplicateQuizInput(sourceQuiz(), {
            methodId: "method-duplicate",
            methodStepIdBySourceId: new Map([
                ["method-step-source", "method-step-duplicate"],
            ]),
            preserveAudience: true,
            quizKind: QUIZ_KIND.methodKnowledge,
            title: "Quiz source - copie",
        });

        expect(input).toMatchObject({
            methodId: "method-duplicate",
            organizationId: "organization-1",
            quizKind: QUIZ_KIND.methodKnowledge,
            scope: "organization",
            status: "draft",
            title: "Quiz source - copie",
        });
        expect(input.steps[0]).toMatchObject({
            methodStepId: "method-step-duplicate",
            name: "Découverte",
            weight: 100,
        });
        expect(input.steps[0]?.questions[0]).toMatchObject({
            choices: [
                { isCorrect: true, label: "Oui" },
                { isCorrect: false, label: "Non" },
            ],
            competenceId: "skill-1",
            prompt: "Quelle question poser ?",
        });
        expect(input.steps[0]?.id).toBeUndefined();
        expect(input.steps[0]?.questions[0]?.id).toBeUndefined();
    });

    it("turns a standalone duplicate into a public contextual quiz", () => {
        const input = buildDuplicateQuizInput(sourceQuiz(), {
            methodId: null,
            preserveAudience: false,
            quizKind: QUIZ_KIND.contextual,
            title: "Quiz autonome",
        });

        expect(input).toMatchObject({
            assignedUserId: null,
            groupId: null,
            methodId: null,
            organizationId: null,
            quizKind: QUIZ_KIND.contextual,
            scope: "public",
        });
        expect(input.steps[0]?.methodStepId).toBeNull();
        expect(input.steps[0]?.questions).toHaveLength(1);
    });
});
