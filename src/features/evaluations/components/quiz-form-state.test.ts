import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { QuizDetail, QuizMethodOption } from "@/features/evaluations/domain";
import {
    DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
    createQuizStepsFromMethod,
    inferQuizAttachmentType,
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

function methodWithSteps(steps: QuizMethodOption["steps"]): QuizMethodOption {
    return {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Méthode DAGO",
        steps,
    };
}

function quizDetail(maxAttempts: number | null): QuizDetail {
    return {
        assignedUserId: null,
        category: "",
        createdAt: null,
        description: "Quiz",
        domain: "",
        durationMinutes: 30,
        groupId: null,
        id: "quiz-1",
        isActive: true,
        kind: "contextual",
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
        category: null,
        description: "",
        domain: null,
        durationMinutes: "30",
        groupId: "",
        maxAttempts,
        methodId: null,
        organizationId: null,
        participation: "optional",
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

describe("createQuizStepsFromMethod", () => {
    it("creates quiz steps from method steps without persisting anything", () => {
        const steps = createQuizStepsFromMethod(
            methodWithSteps([
                {
                    id: "33333333-3333-4333-8333-333333333333",
                    order: 2,
                    title: "Accrocher",
                    weight: null,
                },
                {
                    id: "22222222-2222-4222-8222-222222222222",
                    order: 1,
                    title: "Démarrer",
                    weight: null,
                },
                {
                    id: "44444444-4444-4444-8444-444444444444",
                    order: 3,
                    title: "Conclure",
                    weight: null,
                },
            ]),
        );

        expect(steps.map((step) => step.methodStepId)).toEqual([
            "22222222-2222-4222-8222-222222222222",
            "33333333-3333-4333-8333-333333333333",
            "44444444-4444-4444-8444-444444444444",
        ]);
        expect(steps.map((step) => step.name)).toEqual(["Démarrer", "Accrocher", "Conclure"]);
        expect(steps.map((step) => step.weight)).toEqual(["34", "33", "33"]);
        expect(steps.every((step) => step.questions.length === 0)).toBe(true);
    });

    it("keeps method weights when they already total 100", () => {
        const steps = createQuizStepsFromMethod(
            methodWithSteps([
                {
                    id: "22222222-2222-4222-8222-222222222222",
                    order: 1,
                    title: "Démarrer",
                    weight: 60,
                },
                {
                    id: "33333333-3333-4333-8333-333333333333",
                    order: 2,
                    title: "Conclure",
                    weight: 40,
                },
            ]),
        );

        expect(steps.map((step) => step.weight)).toEqual(["60", "40"]);
    });
});

describe("quizToFormState", () => {
    it("uses the default attempt limit for a new quiz", () => {
        const form = quizToFormState(undefined, [], []);

        expect(form.maxAttempts).toBe(
            DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
        );
        expect(form.scope).toBe("public");
        expect(form.organizationId).toBeNull();
        expect(form.groupId).toBe("");
        expect(form.assignedUserId).toBe("");
    });

    it("preserves unlimited attempts when editing a quiz", () => {
        expect(quizToFormState(quizDetail(null), [], []).maxAttempts).toBeNull();
    });

    it("maps a finite attempt limit to an editable text value", () => {
        expect(quizToFormState(quizDetail(5), [], []).maxAttempts).toBe("5");
    });
});

describe("toSaveQuizInput", () => {
    it("maps unlimited attempts to null", () => {
        expect(toSaveQuizInput(quizForm(null), CONTENT_STATUS.draft).maxAttempts).toBeNull();
    });

    it("maps a finite attempt limit to an integer", () => {
        expect(toSaveQuizInput(quizForm("5"), CONTENT_STATUS.draft).maxAttempts).toBe(5);
    });

    it("keeps an edited title in the save payload", () => {
        const form = quizForm("3");
        form.title = "Nouveau titre du quiz";

        expect(toSaveQuizInput(form, CONTENT_STATUS.draft).title).toBe("Nouveau titre du quiz");
    });

    it("keeps the selected DB dimension item id in quiz questions", () => {
        const dimensionItemId = "55555555-5555-4555-8555-555555555555";
        const form: QuizFormState = {
            assignedUserId: "",
            category: "Prospection",
            description: "Quiz",
            domain: "Commercial",
            durationMinutes: "30",
            groupId: "",
            maxAttempts: "3",
            methodId: null,
            organizationId: null,
            participation: "optional",
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
            category: "Prospection",
            description: "Quiz",
            domain: "Commercial",
            durationMinutes: "30",
            groupId: "",
            maxAttempts: "3",
            methodId: null,
            organizationId: null,
            participation: "optional",
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
