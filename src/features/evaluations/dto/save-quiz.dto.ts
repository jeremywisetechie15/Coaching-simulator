import { z } from "zod";
import { CONTENT_STATUSES } from "@/features/content/domain";
import {
    QUIZ_ATTACHMENT_TYPES,
    QUIZ_DIMENSIONS,
    QUIZ_KINDS,
    QUIZ_PARTICIPATIONS,
    QUIZ_QUESTION_TYPES,
    QUIZ_TYPES,
    QUIZ_VISIBILITY_SCOPES,
} from "@/features/evaluations/domain/quiz";

const textArrayDto = z
    .array(z.string().trim().max(120, "Un tag est trop long."))
    .optional()
    .default([])
    .transform((items) => Array.from(new Set(items.filter((item) => item.length > 0))));

const attachmentDto = z
    .object({
        clientFileId: z.string().trim().max(120, "La référence du fichier est invalide.").optional().default(""),
        externalUrl: z.string().trim().max(1000, "L'URL de la pièce jointe est trop longue.").optional().default(""),
        id: z.string().uuid("La pièce jointe est invalide.").optional(),
        label: z.string().trim().max(180, "Le nom de la pièce jointe est trop long.").optional().default(""),
        storageBucket: z.string().trim().max(120, "Le bucket de la pièce jointe est invalide.").optional().default(""),
        storagePath: z.string().trim().max(1000, "Le chemin de la pièce jointe est trop long.").optional().default(""),
        type: z.enum(QUIZ_ATTACHMENT_TYPES).optional().default("link"),
    })
    .strict()
    .superRefine((attachment, ctx) => {
        if (attachment.storageBucket && !attachment.storagePath) {
            ctx.addIssue({
                code: "custom",
                message: "Le chemin du fichier uploadé est requis.",
                path: ["storagePath"],
            });
        }

        if (attachment.storagePath && !attachment.storageBucket) {
            ctx.addIssue({
                code: "custom",
                message: "Le bucket du fichier uploadé est requis.",
                path: ["storageBucket"],
            });
        }

        if ((attachment.clientFileId || attachment.storagePath) && attachment.type === "link") {
            ctx.addIssue({
                code: "custom",
                message: "Un fichier uploadé doit être de type document, image, vidéo ou audio.",
                path: ["type"],
            });
        }
    })
    .transform((attachment) => ({
        ...attachment,
        label: attachment.label || attachment.externalUrl || attachment.storagePath,
    }));

const choiceDto = z
    .object({
        id: z.string().uuid("La réponse est invalide.").optional(),
        isCorrect: z.boolean().optional().default(false),
        label: z.string().trim().max(800, "La réponse est trop longue.").optional().default(""),
    })
    .strict();

const questionDto = z
    .object({
        attachments: z.array(attachmentDto).optional().default([]),
        choices: z.array(choiceDto).optional().default([]),
        competenceId: z.string().trim().max(160, "La compétence est trop longue.").optional().default(""),
        dimension: z.enum(QUIZ_DIMENSIONS).optional().default("savoir"),
        dimensionItem: z.string().trim().max(500, "L'item évalué est trop long.").optional().default(""),
        dimensionItemId: z
            .preprocess(
                (value) => (value === "" ? null : value),
                z.string().uuid("L'item de dimension sélectionné est invalide.").nullable().optional().default(null),
            ),
        explanation: z.string().trim().max(1600, "L'explication est trop longue.").optional().default(""),
        id: z.string().uuid("La question est invalide.").optional(),
        points: z
            .number()
            .int("Les points doivent être un nombre entier.")
            .min(0, "Les points ne peuvent pas être négatifs.")
            .max(100, "Les points sont trop élevés.")
            .optional()
            .default(1),
        prompt: z.string().trim().max(1800, "La question est trop longue.").optional().default(""),
        type: z.enum(QUIZ_QUESTION_TYPES).optional().default("QCU"),
    })
    .strict();

const stepDto = z
    .object({
        competenceIds: textArrayDto,
        id: z.string().uuid("L'étape est invalide.").optional(),
        methodStepId: z.string().uuid("L'étape de méthode est invalide.").nullable().optional().default(null),
        name: z.string().trim().max(220, "Le nom de l'étape est trop long.").optional().default(""),
        questions: z.array(questionDto).optional().default([]),
        weight: z
            .number()
            .int("La pondération doit être un nombre entier.")
            .min(0, "La pondération ne peut pas être négative.")
            .max(100, "La pondération ne peut pas dépasser 100%.")
            .optional()
            .default(0),
    })
    .strict();

export const saveQuizDto = z
    .object({
        assignedUserId: z.string().uuid("L'utilisateur sélectionné est invalide.").nullable().optional().default(null),
        category: z.string().trim().max(120, "La catégorie est trop longue.").optional().default(""),
        description: z.string().trim().max(4000, "La description est trop longue.").optional().default(""),
        domain: z.string().trim().max(120, "Le domaine est trop long.").optional().default(""),
        durationMinutes: z
            .number()
            .int("La durée doit être un nombre entier.")
            .min(1, "La durée doit être supérieure à 0.")
            .optional()
            .default(30),
        groupId: z.string().uuid("Le groupe sélectionné est invalide.").nullable().optional().default(null),
        maxAttempts: z
            .number()
            .int("Le nombre de tentatives doit être un nombre entier.")
            .min(1, "Le nombre de tentatives doit être supérieur à 0.")
            .nullable()
            .optional()
            .default(3),
        methodId: z.string().uuid("La méthode associée est invalide.").nullable().optional().default(null),
        organizationId: z.string().uuid("L'organisation sélectionnée est invalide.").nullable().optional().default(null),
        participation: z.enum(QUIZ_PARTICIPATIONS).optional().default("optional"),
        quizKind: z.enum(QUIZ_KINDS).optional().default("contextual"),
        quizType: z.enum(QUIZ_TYPES).optional().default("knowledge"),
        scope: z.enum(QUIZ_VISIBILITY_SCOPES).optional().default("public"),
        status: z.enum(CONTENT_STATUSES).optional().default("draft"),
        steps: z.array(stepDto).optional().default([]),
        tags: textArrayDto,
        title: z.string().trim().min(1, "Le titre du quiz est requis.").max(180, "Le titre est trop long."),
        validationThreshold: z
            .number()
            .int("Le seuil doit être un nombre entier.")
            .min(0, "Le seuil ne peut pas être négatif.")
            .max(100, "Le seuil ne peut pas dépasser 100%.")
            .nullable()
            .optional()
            .default(null),
    })
    .strict()
    .superRefine((quiz, ctx) => {
        if (quiz.quizKind === "method_knowledge" && !quiz.methodId) {
            ctx.addIssue({
                code: "custom",
                message: "Un quiz de méthode doit être lié à une méthode.",
                path: ["methodId"],
            });
        }

        if (quiz.status !== "published") {
            return;
        }

        if (
            (quiz.scope === "organization" || quiz.scope === "group")
            && !quiz.organizationId
        ) {
            ctx.addIssue({
                code: "custom",
                message: "Un quiz privé organisation doit être lié à une organisation.",
                path: ["organizationId"],
            });
        }

        if (quiz.scope === "group" && !quiz.groupId) {
            ctx.addIssue({
                code: "custom",
                message: "Un quiz privé groupe doit être lié à un groupe.",
                path: ["groupId"],
            });
        }

        if (quiz.scope === "user" && !quiz.assignedUserId) {
            ctx.addIssue({
                code: "custom",
                message: "Un quiz privé utilisateur doit être lié à un utilisateur.",
                path: ["assignedUserId"],
            });
        }

        if (!quiz.description.trim()) {
            ctx.addIssue({
                code: "custom",
                message: "La description est requise pour publier un quiz.",
                path: ["description"],
            });
        }

        if (quiz.steps.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Un quiz publié doit contenir au moins une étape.",
                path: ["steps"],
            });
        }

        const totalWeight = quiz.steps.reduce((sum, step) => sum + step.weight, 0);
        if (totalWeight > 0 && totalWeight !== 100) {
            ctx.addIssue({
                code: "custom",
                message: "La pondération des étapes doit totaliser 100%.",
                path: ["steps"],
            });
        }

        quiz.steps.forEach((step, stepIndex) => {
            if (!step.name.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Le nom de chaque étape est requis.",
                    path: ["steps", stepIndex, "name"],
                });
            }

            if (step.questions.length === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Chaque étape publiée doit contenir au moins une question.",
                    path: ["steps", stepIndex, "questions"],
                });
            }

            step.questions.forEach((question, questionIndex) => {
                if (!question.prompt.trim()) {
                    ctx.addIssue({
                        code: "custom",
                        message: "L'énoncé de chaque question est requis.",
                        path: ["steps", stepIndex, "questions", questionIndex, "prompt"],
                    });
                }

                if (!question.competenceId.trim()) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque question publiée doit cibler une compétence.",
                        path: ["steps", stepIndex, "questions", questionIndex, "competenceId"],
                    });
                }

                if (!question.dimensionItemId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque question publiée doit cibler un item de dimension.",
                        path: ["steps", stepIndex, "questions", questionIndex, "dimensionItemId"],
                    });
                }

                const nonEmptyChoices = question.choices.filter((choice) => choice.label.trim().length > 0);
                const correctChoices = nonEmptyChoices.filter((choice) => choice.isCorrect);

                if (nonEmptyChoices.length < 2) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque question publiée doit proposer au moins deux réponses.",
                        path: ["steps", stepIndex, "questions", questionIndex, "choices"],
                    });
                }

                if (question.type === "QCU" && correctChoices.length !== 1) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Une question QCU publiée doit avoir exactement une bonne réponse.",
                        path: ["steps", stepIndex, "questions", questionIndex, "choices"],
                    });
                }

                if (question.type === "QCM" && correctChoices.length === 0) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Une question QCM publiée doit avoir au moins une bonne réponse.",
                        path: ["steps", stepIndex, "questions", questionIndex, "choices"],
                    });
                }
            });
        });
    });

export type SaveQuizInput = z.input<typeof saveQuizDto>;
export type SaveQuizDto = z.output<typeof saveQuizDto>;
