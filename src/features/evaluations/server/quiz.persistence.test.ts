import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND, QUIZ_VISIBILITY_SCOPE } from "@/features/evaluations/domain";
import { saveQuizDto } from "@/features/evaluations/dto";
import { mapQuizRowsToDetail } from "./quiz.mapper";
import {
    createAttachmentRows,
    createChoiceRows,
    createQuestionRows,
    createQuizInsert,
    createQuizUpdate,
    createStepRows,
} from "./quiz.persistence";

const dimensionItemId = "44444444-4444-4444-8444-444444444444";

describe("quiz persistence helpers", () => {
    it("maps a save DTO to quiz, step, question, choice and attachment rows", () => {
        const input = saveQuizDto.parse({
            description: "Quiz de méthode.",
            durationMinutes: 20,
            maxAttempts: 2,
            methodId: "11111111-1111-4111-8111-111111111111",
            organizationId: "22222222-2222-4222-8222-222222222222",
            quizKind: QUIZ_KIND.methodKnowledge,
            scope: QUIZ_VISIBILITY_SCOPE.organization,
            status: CONTENT_STATUS.published,
            steps: [
                {
                    competenceIds: ["acces-decideur"],
                    name: "Accroche",
                    questions: [
                        {
                            attachments: [
                                {
                                    externalUrl: "https://example.com/guide.pdf",
                                    label: "Guide",
                                    type: "document",
                                },
                                {
                                    label: "Vidéo",
                                    storageBucket: "quizzes",
                                    storagePath: "quizzes/quiz-1/questions/question-1/attachments/video.mp4",
                                    type: "video",
                                },
                                {
                                    externalUrl: "",
                                    label: "Vide",
                                    type: "link",
                                },
                            ],
                            choices: [
                                { isCorrect: true, label: "Bonne réponse" },
                                { isCorrect: false, label: "Mauvaise réponse" },
                                { isCorrect: false, label: "" },
                            ],
                            competenceId: "acces-decideur",
                            dimension: "savoir",
                            dimensionItem: "Connaissance de la méthode",
                            dimensionItemId,
                            prompt: "Quelle est l'accroche ?",
                            type: "QCU",
                        },
                    ],
                    weight: 100,
                },
            ],
            title: "Quiz méthode",
            validationThreshold: 70,
        });

        const quizInsert = createQuizInsert(input, "33333333-3333-4333-8333-333333333333");
        expect(quizInsert).toMatchObject({
            is_active: true,
            method_id: "11111111-1111-4111-8111-111111111111",
            organization_id: "22222222-2222-4222-8222-222222222222",
            quiz_kind: QUIZ_KIND.methodKnowledge,
            title: "Quiz méthode",
            visibility_scope: QUIZ_VISIBILITY_SCOPE.organization,
        });

        const stepRows = createStepRows("quiz-1", input);
        expect(stepRows).toEqual([
            {
                method_step_id: null,
                name: "Accroche",
                quiz_id: "quiz-1",
                step_order: 1,
                weight: 100,
            },
        ]);

        const stepIdsByOrder = new Map([[1, "step-1"]]);
        const questionRows = createQuestionRows(input, stepIdsByOrder);
        expect(questionRows).toEqual([
            {
                competence_id: "acces-decideur",
                dimension: "savoir",
                dimension_item: "Connaissance de la méthode",
                dimension_item_id: dimensionItemId,
                explanation: null,
                points: 1,
                prompt: "Quelle est l'accroche ?",
                question_order: 1,
                question_type: "QCU",
                step_id: "step-1",
            },
        ]);

        const questionIdsByStepIdAndOrder = new Map([["step-1:1", "question-1"]]);
        expect(createChoiceRows(input, stepIdsByOrder, questionIdsByStepIdAndOrder)).toEqual([
            {
                choice_order: 1,
                is_correct: true,
                label: "Bonne réponse",
                question_id: "question-1",
            },
            {
                choice_order: 2,
                is_correct: false,
                label: "Mauvaise réponse",
                question_id: "question-1",
            },
        ]);
        expect(createAttachmentRows(input, stepIdsByOrder, questionIdsByStepIdAndOrder)).toEqual([
            {
                attachment_order: 1,
                attachment_type: "document",
                external_url: "https://example.com/guide.pdf",
                id: undefined,
                label: "Guide",
                question_id: "question-1",
                storage_bucket: null,
                storage_path: null,
            },
            {
                attachment_order: 2,
                attachment_type: "video",
                external_url: null,
                id: undefined,
                label: "Vidéo",
                question_id: "question-1",
                storage_bucket: "quizzes",
                storage_path: "quizzes/quiz-1/questions/question-1/attachments/video.mp4",
            },
        ]);
    });

    it("marks archived quiz updates inactive", () => {
        const input = saveQuizDto.parse({
            status: CONTENT_STATUS.archived,
            title: "Quiz archivé",
        });

        expect(createQuizUpdate(input)).toMatchObject({
            is_active: false,
            status: CONTENT_STATUS.archived,
        });
    });
});

describe("quiz mapper", () => {
    it("builds a sorted quiz detail from normalized rows", () => {
        const detail = mapQuizRowsToDetail(
            {
                id: "quiz-1",
                is_active: true,
                method_id: "method-1",
                method_name: "Méthode ACDC",
                quiz_kind: QUIZ_KIND.methodKnowledge,
                status: CONTENT_STATUS.published,
                tags: ["vente", ""],
                title: "Quiz ACDC",
            },
            [
                {
                    id: "step-2",
                    name: "Découvrir",
                    quiz_id: "quiz-1",
                    step_order: 2,
                    weight: 60,
                },
                {
                    id: "step-1",
                    name: "Accrocher",
                    quiz_id: "quiz-1",
                    step_order: 1,
                    weight: 40,
                },
            ],
            [
                { competence_id: "gestion-objections", step_id: "step-2" },
                { competence_id: "acces-decideur", step_id: "step-1" },
            ],
            [
                {
                    id: "question-2",
                    prompt: "Question 2",
                    question_order: 1,
                    step_id: "step-2",
                },
                {
                    id: "question-1",
                    dimension_item_id: dimensionItemId,
                    prompt: "Question 1",
                    question_order: 1,
                    step_id: "step-1",
                },
            ],
            [
                {
                    choice_order: 2,
                    id: "choice-2",
                    is_correct: false,
                    label: "B",
                    question_id: "question-1",
                },
                {
                    choice_order: 1,
                    id: "choice-1",
                    is_correct: true,
                    label: "A",
                    question_id: "question-1",
                },
            ],
            [
                {
                    attachment_order: 1,
                    external_url: "https://example.com",
                    id: "attachment-1",
                    question_id: "question-1",
                    storage_bucket: null,
                    storage_path: null,
                },
            ],
        );

        expect(detail.methodName).toBe("Méthode ACDC");
        expect(detail.questionCount).toBe(2);
        expect(detail.steps.map((step) => step.name)).toEqual(["Accrocher", "Découvrir"]);
        expect(detail.steps[0].competenceIds).toEqual(["acces-decideur"]);
        expect(detail.steps[0].questions[0].choices.map((choice) => choice.label)).toEqual(["A", "B"]);
        expect(detail.steps[0].questions[0].attachments[0].label).toBe("https://example.com");
        expect(detail.steps[0].questions[0].dimensionItemId).toBe(dimensionItemId);
        expect(detail.tags).toEqual(["vente"]);
    });
});
