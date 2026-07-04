import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND, QUIZ_VISIBILITY_SCOPE } from "@/features/evaluations/domain";
import { saveQuizDto, type SaveQuizInput } from "./save-quiz.dto";

const methodId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const dimensionItemId = "33333333-3333-4333-8333-333333333333";

function publishedQuiz(overrides: Partial<SaveQuizInput> = {}): SaveQuizInput {
    return {
        category: "Prospection",
        description: "Vérifier la connaissance de la méthode.",
        domain: "Commercial",
        durationMinutes: 30,
        maxAttempts: 3,
        participation: "mandatory",
        quizKind: QUIZ_KIND.contextual,
        quizType: "knowledge",
        scope: QUIZ_VISIBILITY_SCOPE.public,
        status: CONTENT_STATUS.published,
        steps: [
            {
                competenceIds: ["acces-decideur"],
                name: "Accroche",
                questions: [
                    {
                        choices: [
                            { isCorrect: true, label: "Réponse A" },
                            { isCorrect: false, label: "Réponse B" },
                        ],
                        competenceId: "acces-decideur",
                        dimension: "savoir",
                        dimensionItem: "Connaissance de la méthode",
                        dimensionItemId,
                        prompt: "Quelle est la première étape ?",
                        type: "QCU",
                    },
                ],
                weight: 100,
            },
        ],
        tags: ["commercial"],
        title: "Quiz DEEPMARK",
        validationThreshold: 70,
        ...overrides,
    };
}

describe("saveQuizDto", () => {
    it("accepts a minimal contextual draft", () => {
        const result = saveQuizDto.parse({ title: "Quiz brouillon" });

        expect(result.status).toBe(CONTENT_STATUS.draft);
        expect(result.quizKind).toBe(QUIZ_KIND.contextual);
        expect(result.steps).toEqual([]);
    });

    it("requires a method for a method knowledge quiz", () => {
        const result = saveQuizDto.safeParse({
            quizKind: QUIZ_KIND.methodKnowledge,
            title: "Quiz méthode",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Un quiz de méthode doit être lié à une méthode.",
        );
    });

    it("requires an organization target for organization-private quizzes", () => {
        const result = saveQuizDto.safeParse({
            scope: QUIZ_VISIBILITY_SCOPE.organization,
            title: "Quiz privé",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Un quiz privé organisation doit être lié à une organisation.",
        );
    });

    it("accepts a complete published method quiz", () => {
        const result = saveQuizDto.parse(
            publishedQuiz({
                methodId,
                organizationId,
                quizKind: QUIZ_KIND.methodKnowledge,
                scope: QUIZ_VISIBILITY_SCOPE.organization,
            }),
        );

        expect(result.methodId).toBe(methodId);
        expect(result.organizationId).toBe(organizationId);
        expect(result.status).toBe(CONTENT_STATUS.published);
    });

    it("accepts uploaded document, image, video or audio attachments", () => {
        const result = saveQuizDto.parse(
            publishedQuiz({
                steps: [
                    {
                        ...publishedQuiz().steps![0],
                        questions: [
                            {
                                ...publishedQuiz().steps![0].questions![0],
                                attachments: [
                                    {
                                        label: "Vidéo produit",
                                        storageBucket: "quizzes",
                                        storagePath: "quizzes/quiz-1/questions/question-1/attachments/video.mp4",
                                        type: "video",
                                    },
                                    {
                                        label: "Audio objection",
                                        storageBucket: "quizzes",
                                        storagePath: "quizzes/quiz-1/questions/question-1/attachments/audio.mp3",
                                        type: "audio",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.steps[0].questions[0].attachments[0]).toMatchObject({
            externalUrl: "",
            label: "Vidéo produit",
            storageBucket: "quizzes",
            storagePath: "quizzes/quiz-1/questions/question-1/attachments/video.mp4",
            type: "video",
        });
        expect(result.steps[0].questions[0].attachments[1]).toMatchObject({
            externalUrl: "",
            label: "Audio objection",
            storageBucket: "quizzes",
            storagePath: "quizzes/quiz-1/questions/question-1/attachments/audio.mp3",
            type: "audio",
        });
    });

    it("rejects uploaded attachments typed as simple links", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({
                steps: [
                    {
                        ...publishedQuiz().steps![0],
                        questions: [
                            {
                                ...publishedQuiz().steps![0].questions![0],
                                attachments: [
                                    {
                                        clientFileId: "file-1",
                                        label: "Fichier",
                                        type: "link",
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Un fichier uploadé doit être de type document, image, vidéo ou audio.",
        );
    });

    it("rejects published quizzes when step weights do not total 100", () => {
        const input = publishedQuiz({
            steps: [
                {
                    ...publishedQuiz().steps![0],
                    weight: 60,
                },
            ],
        });

        const result = saveQuizDto.safeParse(input);

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "La pondération des étapes doit totaliser 100%.",
        );
    });

    it("requires a dimension item id for published questions", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({
                steps: [
                    {
                        ...publishedQuiz().steps![0],
                        questions: [
                            {
                                ...publishedQuiz().steps![0].questions![0],
                                dimensionItemId: null,
                            },
                        ],
                    },
                ],
            }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.questions.0.dimensionItemId",
        );
    });

    it("requires exactly one correct answer for published QCU questions", () => {
        const input = publishedQuiz({
            steps: [
                {
                    ...publishedQuiz().steps![0],
                    questions: [
                        {
                            ...publishedQuiz().steps![0].questions![0],
                            choices: [
                                { isCorrect: true, label: "Réponse A" },
                                { isCorrect: true, label: "Réponse B" },
                            ],
                        },
                    ],
                },
            ],
        });

        const result = saveQuizDto.safeParse(input);

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.message)).toContain(
            "Une question QCU publiée doit avoir exactement une bonne réponse.",
        );
    });
});
