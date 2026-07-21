import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { QUIZ_KIND, QUIZ_VISIBILITY_SCOPE } from "@/features/evaluations/domain";
import { saveQuizDto, type SaveQuizInput } from "./save-quiz.dto";

const methodId = "11111111-1111-4111-8111-111111111111";
const organizationId = "22222222-2222-4222-8222-222222222222";
const dimensionItemId = "33333333-3333-4333-8333-333333333333";
const groupId = "44444444-4444-4444-8444-444444444444";

function publishedQuiz(overrides: Partial<SaveQuizInput> = {}): SaveQuizInput {
    return {
        categories: ["Prospection"],
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

        expect(result.categories).toEqual([]);
        expect(result.maxAttempts).toBe(3);
        expect(result.status).toBe(CONTENT_STATUS.draft);
        expect(result.quizKind).toBe(QUIZ_KIND.contextual);
        expect(result.scope).toBe(QUIZ_VISIBILITY_SCOPE.public);
        expect(result.organizationId).toBeNull();
        expect(result.groupId).toBeNull();
        expect(result.assignedUserId).toBeNull();
        expect(result.steps).toEqual([]);
    });

    it("accepts a published quiz without a domain or categories", () => {
        const result = saveQuizDto.parse(publishedQuiz({ categories: [], domain: "" }));

        expect(result.domain).toBe("");
        expect(result.categories).toEqual([]);
    });

    it("accepts multiple categories from the selected domain", () => {
        const result = saveQuizDto.parse(
            publishedQuiz({ categories: ["Prospection", "Vente"] }),
        );

        expect(result.categories).toEqual(["Prospection", "Vente"]);
    });

    it("accepts a domain without categories", () => {
        const result = saveQuizDto.parse(
            publishedQuiz({ categories: [], domain: "Commercial" }),
        );

        expect(result.domain).toBe("Commercial");
        expect(result.categories).toEqual([]);
    });

    it("rejects a domain outside the shared taxonomy", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({ categories: [], domain: "Domaine inconnu" }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("domain");
    });

    it("rejects categories without a domain", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({ categories: ["Prospection"], domain: "" }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("categories");
    });

    it("rejects a category from another domain", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({ categories: ["Feedback"], domain: "Commercial" }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("categories.0");
    });

    it("accepts unlimited attempts", () => {
        const result = saveQuizDto.parse({
            maxAttempts: null,
            title: "Quiz sans limite",
        });

        expect(result.maxAttempts).toBeNull();
    });

    it.each([0, -1, 1.5])("rejects an invalid %s attempt limit", (maxAttempts) => {
        const result = saveQuizDto.safeParse({
            maxAttempts,
            title: "Quiz invalide",
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain("maxAttempts");
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

    it.each([
        QUIZ_VISIBILITY_SCOPE.organization,
        QUIZ_VISIBILITY_SCOPE.group,
        QUIZ_VISIBILITY_SCOPE.user,
    ])("accepts an incomplete %s visibility target in a draft", (scope) => {
        const result = saveQuizDto.parse({ scope, title: "Quiz privé" });

        expect(result.scope).toBe(scope);
        expect(result.organizationId).toBeNull();
        expect(result.groupId).toBeNull();
        expect(result.assignedUserId).toBeNull();
    });

    it("requires an organization target to publish an organization-private quiz", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({ scope: QUIZ_VISIBILITY_SCOPE.organization }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "organizationId",
        );
    });

    it("requires an organization and group target to publish a group-private quiz", () => {
        const withoutOrganization = saveQuizDto.safeParse(
            publishedQuiz({ groupId, scope: QUIZ_VISIBILITY_SCOPE.group }),
        );
        const withoutGroup = saveQuizDto.safeParse(
            publishedQuiz({ organizationId, scope: QUIZ_VISIBILITY_SCOPE.group }),
        );

        expect(withoutOrganization.success).toBe(false);
        expect(withoutOrganization.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "organizationId",
        );
        expect(withoutGroup.success).toBe(false);
        expect(withoutGroup.error?.issues.map((issue) => issue.path.join("."))).toContain("groupId");
    });

    it("requires a user target to publish a user-private quiz", () => {
        const result = saveQuizDto.safeParse(
            publishedQuiz({ scope: QUIZ_VISIBILITY_SCOPE.user }),
        );

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "assignedUserId",
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

    it("rejects quiz questions that target a dimension other than savoir", () => {
        const quiz = publishedQuiz();
        const result = saveQuizDto.safeParse({
            ...quiz,
            steps: quiz.steps?.map((step) => ({
                ...step,
                questions: step.questions?.map((question) => ({
                    ...question,
                    dimension: "savoir_faire",
                })),
            })),
        });

        expect(result.success).toBe(false);
        expect(result.error?.issues.map((issue) => issue.path.join("."))).toContain(
            "steps.0.questions.0.dimension",
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
