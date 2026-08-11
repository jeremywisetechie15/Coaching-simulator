import { describe, expect, it } from "vitest";
import {
    CONTENT_STATUS,
    LEARNER_CONTENT_STATUS,
} from "@/features/content/domain";
import { QUIZ_KIND, type QuizDetail } from "@/features/evaluations/domain";
import {
    DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
    changeQuizMethod,
    inferQuizAttachmentType,
    maxAttemptsForLimitMode,
    normalizeChoicesForQuestionType,
    quizToFormState,
    toSaveQuizInput,
    type QuizChoiceFormState,
    type QuizFormState,
} from "./quiz-form-state";

function choices(values: boolean[]): QuizChoiceFormState[] {
    return values.map((isCorrect, index) => ({
        id: `choice-${index + 1}`,
        isCorrect,
        label: `Réponse ${index + 1}`,
    }));
}

function quizDetail(maxAttempts: number | null): QuizDetail {
    return {
        assignedUserId: null,
        categories: [],
        createdAt: null,
        description: "Quiz",
        difficulty: "Moyen",
        domain: "",
        durationMinutes: 30,
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
        maxAttempts,
        methodId: null,
        methodName: null,
        organizationId: null,
        participation: "optional",
        questionCount: 0,
        scope: "public",
        status: "draft",
        steps: [],
        tags: [],
        title: "Quiz",
        type: "knowledge",
        updatedAt: null,
        validationThreshold: null,
    };
}

function quizForm(maxAttempts: string | null): QuizFormState {
    return {
        assignedUserId: "",
        categories: [],
        description: "",
        difficulty: null,
        domain: null,
        durationMinutes: "30",
        groupId: "",
        maxAttempts,
        methodId: null,
        organizationId: null,
        participation: "optional",
        quizKind: QUIZ_KIND.contextual,
        quizType: "knowledge",
        scope: "public",
        steps: [],
        tags: [],
        title: "Quiz",
        validationThreshold: "",
    };
}

describe("normalizeChoicesForQuestionType", () => {
    it("keeps only the first correct answer for QCU questions", () => {
        const result = normalizeChoicesForQuestionType(choices([false, true, true, false]), "QCU");

        expect(result.map((choice) => choice.isCorrect)).toEqual([false, true, false, false]);
    });

    it("marks the first answer as correct for QCU questions without a correct answer", () => {
        const result = normalizeChoicesForQuestionType(choices([false, false, false]), "QCU");

        expect(result.map((choice) => choice.isCorrect)).toEqual([true, false, false]);
    });

    it("leaves QCM answers unchanged", () => {
        const input = choices([true, false, true]);
        const result = normalizeChoicesForQuestionType(input, "QCM");

        expect(result).toEqual(input);
    });
});

describe("inferQuizAttachmentType", () => {
    it("keeps audio files typed as audio attachments", () => {
        expect(inferQuizAttachmentType("audio/mpeg")).toBe("audio");
    });
});

describe("changeQuizMethod", () => {
    it("preserves groups and questions while clearing only stale method-step links", () => {
        const form = quizForm("3");
        const questions = [{ id: "question-1" }] as QuizFormState["steps"][number]["questions"];
        form.methodId = "11111111-1111-4111-8111-111111111111";
        form.steps = [{
            collapsed: false,
            competenceIds: ["skill-1"],
            id: "step-1",
            methodStepId: "22222222-2222-4222-8222-222222222222",
            name: "Découverte",
            questions,
            weight: "100",
        }];

        const result = changeQuizMethod(
            form,
            "33333333-3333-4333-8333-333333333333",
        );

        expect(result.steps).toHaveLength(1);
        expect(result.steps[0]).toMatchObject({
            competenceIds: ["skill-1"],
            methodStepId: null,
            name: "Découverte",
            weight: "100",
        });
        expect(result.steps[0].questions).toBe(questions);
    });
});

describe("quizToFormState", () => {
    it("uses unlimited attempts for a new quiz", () => {
        const form = quizToFormState(undefined, [], []);

        expect(form.maxAttempts).toBeNull();
        expect(form.scope).toBe("public");
        expect(form.organizationId).toBeNull();
        expect(form.groupId).toBe("");
        expect(form.assignedUserId).toBe("");
        expect(form.quizKind).toBe(QUIZ_KIND.contextual);
    });

    it("preserves unlimited attempts when editing a quiz", () => {
        expect(quizToFormState(quizDetail(null), [], []).maxAttempts).toBeNull();
    });

    it("maps a finite attempt limit to an editable text value", () => {
        expect(quizToFormState(quizDetail(5), [], []).maxAttempts).toBe("5");
    });

    it("keeps the persisted difficulty when editing a quiz", () => {
        expect(quizToFormState(quizDetail(3), [], []).difficulty).toBe("Moyen");
    });
});

describe("maxAttemptsForLimitMode", () => {
    it("defaults to three attempts when switching from unlimited to limited", () => {
        expect(maxAttemptsForLimitMode(null, "limited")).toBe(
            DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
        );
    });

    it("keeps an existing limit when limited mode is already configured", () => {
        expect(maxAttemptsForLimitMode("5", "limited")).toBe("5");
    });

    it("clears the limit when switching to unlimited", () => {
        expect(maxAttemptsForLimitMode("3", "unlimited")).toBeNull();
    });
});

describe("toSaveQuizInput", () => {
    it("maps unlimited attempts to null", () => {
        expect(toSaveQuizInput(quizForm(null), CONTENT_STATUS.draft).maxAttempts).toBeNull();
    });

    it("maps a finite attempt limit to an integer", () => {
        expect(toSaveQuizInput(quizForm("5"), CONTENT_STATUS.draft).maxAttempts).toBe(5);
    });

    it("keeps the selected difficulty in the save payload", () => {
        const form = quizForm("3");
        form.difficulty = "Difficile";

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft).difficulty).toBe("Difficile");
    });

    it("keeps optional method links on contextual quiz payloads", () => {
        const form = quizForm("3");
        form.methodId = "11111111-1111-4111-8111-111111111111";

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft)).toMatchObject({
            methodId: "11111111-1111-4111-8111-111111111111",
            quizKind: QUIZ_KIND.contextual,
        });
    });

    it("preserves the method quiz kind when editing the canonical quiz", () => {
        const quiz = quizDetail(3);
        quiz.kind = QUIZ_KIND.methodKnowledge;
        quiz.methodId = "11111111-1111-4111-8111-111111111111";
        const form = quizToFormState(quiz, [], []);

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft)).toMatchObject({
            methodId: "11111111-1111-4111-8111-111111111111",
            quizKind: QUIZ_KIND.methodKnowledge,
        });
    });

    it("keeps an edited title in the save payload", () => {
        const form = quizForm("3");
        form.title = "Nouveau titre du quiz";

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft).title).toBe("Nouveau titre du quiz");
    });

    it("clears categories when the quiz has no domain", () => {
        const form = quizForm("3");
        form.categories = ["Prospection"];

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft).categories).toEqual([]);
    });

    it("keeps the selected DB dimension item id in quiz questions", () => {
        const dimensionItemId = "55555555-5555-4555-8555-555555555555";
        const form: QuizFormState = {
            assignedUserId: "",
            categories: ["Prospection"],
            description: "Quiz",
            difficulty: "Moyen",
            domain: "Commerce et développement commercial",
            durationMinutes: "30",
            groupId: "",
            maxAttempts: "3",
            methodId: null,
            organizationId: null,
            participation: "optional",
            quizKind: QUIZ_KIND.contextual,
            quizType: "knowledge",
            scope: "public",
            steps: [
                {
                    collapsed: false,
                    competenceIds: ["acces-decideur"],
                    id: "step-1",
                    methodStepId: null,
                    name: "Accroche",
                    questions: [
                        {
                            attachments: [],
                            choices: choices([true, false]),
                            competenceId: "acces-decideur",
                            dimension: "savoir",
                            dimensionItem: "Comprendre les filtres organisationnels",
                            dimensionItemId,
                            explanation: "",
                            id: "question-1",
                            points: "1",
                            prompt: "Question",
                            type: "QCU",
                        },
                    ],
                    weight: "100",
                },
            ],
            tags: [],
            title: "Quiz",
            validationThreshold: "70",
        };

        const result = toSaveQuizInput(form, CONTENT_STATUS.draft);

        expect(result.steps?.[0]?.questions?.[0]).toMatchObject({
            dimensionItem: "Comprendre les filtres organisationnels",
            dimensionItemId,
        });
    });

    it("keeps file attachments as client file references until server submit materializes them", () => {
        const form: QuizFormState = {
            assignedUserId: "",
            categories: ["Prospection"],
            description: "Quiz",
            difficulty: "Moyen",
            domain: "Commerce et développement commercial",
            durationMinutes: "30",
            groupId: "",
            maxAttempts: "3",
            methodId: null,
            organizationId: null,
            participation: "optional",
            quizKind: QUIZ_KIND.contextual,
            quizType: "knowledge",
            scope: "public",
            steps: [
                {
                    collapsed: false,
                    competenceIds: ["acces-decideur"],
                    id: "step-1",
                    methodStepId: null,
                    name: "Accroche",
                    questions: [
                        {
                            attachments: [
                                {
                                    clientFileId: "quiz-attachment-file-1",
                                    deliveryType: "file",
                                    externalUrl: "",
                                    file: {
                                        name: "brief.pdf",
                                        size: 1024,
                                        type: "application/pdf",
                                    } as File,
                                    id: "attachment-1",
                                    label: "Brief",
                                    storageBucket: "",
                                    storagePath: "",
                                    type: "document",
                                    uploadedFileName: "brief.pdf",
                                    uploadedFileSizeBytes: 1024,
                                },
                            ],
                            choices: choices([true, false]),
                            competenceId: "acces-decideur",
                            dimension: "savoir",
                            dimensionItem: "Comprendre les filtres organisationnels",
                            dimensionItemId: "55555555-5555-4555-8555-555555555555",
                            explanation: "",
                            id: "question-1",
                            points: "1",
                            prompt: "Question",
                            type: "QCU",
                        },
                    ],
                    weight: "100",
                },
            ],
            tags: [],
            title: "Quiz",
            validationThreshold: "70",
        };

        const result = toSaveQuizInput(form, CONTENT_STATUS.draft);
        const attachment = result.steps?.[0]?.questions?.[0]?.attachments?.[0];

        expect(attachment).toMatchObject({
            clientFileId: "quiz-attachment-file-1",
            storageBucket: "",
            storagePath: "",
            type: "document",
        });
    });
});
