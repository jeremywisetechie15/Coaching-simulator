import { z } from "zod";
import { CONTENT_STATUSES } from "@/features/content/domain";
import { SCORECARD_VISIBILITIES } from "@/features/scorecards/domain";
import { SKILL_DIMENSIONS } from "@/features/skills/domain/skills";

const optionalTextDto = (max: number, message: string) =>
    z.string().trim().max(max, message).optional().default("");

const criterionDto = z
    .object({
        aiInstruction: optionalTextDto(1600, "La consigne IA est trop longue."),
        competenceId: z.string().trim().max(160, "La compétence est trop longue.").optional().default(""),
        dimension: z.enum(SKILL_DIMENSIONS).nullable().optional().default(null),
        dimensionItemId: z
            .preprocess(
                (value) => (value === "" ? null : value),
                z.string().uuid("L'item de dimension sélectionné est invalide.").nullable().optional().default(null),
            ),
        expectedEvidence: optionalTextDto(1200, "Les preuves attendues sont trop longues."),
        id: z.string().trim().max(120, "Le critère est invalide.").optional(),
        key: optionalTextDto(600, "Le critère clé est trop long."),
        maxPoints: z
            .number()
            .int("Les points doivent être un nombre entier.")
            .min(1, "Les points doivent être supérieurs à 0.")
            .max(100, "Les points sont trop élevés.")
            .optional()
            .default(1),
        order: z
            .number()
            .int("L'ordre doit être un nombre entier.")
            .min(1, "L'ordre doit être supérieur à 0.")
            .optional()
            .default(1),
        verbatim: optionalTextDto(1600, "Le verbatim est trop long."),
    })
    .strict();

const stepDto = z
    .object({
        criteria: z.array(criterionDto).optional().default([]),
        id: z.string().trim().max(120, "L'étape est invalide.").optional(),
        methodStepId: z.string().uuid("L'étape de méthode est invalide."),
        name: z.string().trim().max(220, "Le nom de l'étape est trop long.").optional().default(""),
        order: z
            .number()
            .int("L'ordre de l'étape doit être un nombre entier.")
            .min(1, "L'ordre de l'étape doit être supérieur à 0.")
            .optional()
            .default(1),
    })
    .strict();

export const saveScorecardDto = z
    .object({
        category: optionalTextDto(120, "La catégorie est trop longue."),
        description: optionalTextDto(4000, "La description est trop longue."),
        domain: optionalTextDto(120, "Le domaine est trop long."),
        level: optionalTextDto(120, "Le niveau est trop long."),
        methodId: z.string().uuid("La méthode associée est invalide."),
        name: z.string().trim().min(1, "Le nom de la scorecard est requis.").max(180, "Le nom est trop long."),
        organizationId: z.string().uuid("L'organisation sélectionnée est invalide.").nullable().optional().default(null),
        status: z.enum(CONTENT_STATUSES).optional().default("draft"),
        steps: z.array(stepDto).optional().default([]),
        visibility: z.enum(SCORECARD_VISIBILITIES).optional().default("public"),
    })
    .strict()
    .superRefine((scorecard, ctx) => {
        if (scorecard.visibility === "private" && !scorecard.organizationId) {
            ctx.addIssue({
                code: "custom",
                message: "Une scorecard privée doit être liée à une organisation.",
                path: ["organizationId"],
            });
        }

        scorecard.steps.forEach((step, stepIndex) => {
            if (!step.name.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Le nom de chaque étape est requis.",
                    path: ["steps", stepIndex, "name"],
                });
            }

            step.criteria.forEach((criterion, criterionIndex) => {
                const path = ["steps", stepIndex, "criteria", criterionIndex];

                if (!criterion.key.trim()) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Le critère clé est requis.",
                        path: [...path, "key"],
                    });
                }

                if (!criterion.expectedEvidence.trim()) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Les preuves attendues sont requises.",
                        path: [...path, "expectedEvidence"],
                    });
                }

                if (!criterion.competenceId.trim()) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque critère doit cibler une compétence.",
                        path: [...path, "competenceId"],
                    });
                }

                if (!criterion.dimension) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque critère doit cibler une dimension.",
                        path: [...path, "dimension"],
                    });
                }

                if (!criterion.dimensionItemId) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Chaque critère doit cibler un item de dimension.",
                        path: [...path, "dimensionItemId"],
                    });
                }
            });
        });

        if (scorecard.status !== "published") {
            return;
        }

        if (scorecard.steps.length === 0) {
            ctx.addIssue({
                code: "custom",
                message: "Une scorecard publiée doit contenir au moins une étape.",
                path: ["steps"],
            });
        }

        scorecard.steps.forEach((step, stepIndex) => {
            if (step.criteria.length === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Chaque étape publiée doit contenir au moins un critère.",
                    path: ["steps", stepIndex, "criteria"],
                });
            }
        });
    });

export type SaveScorecardInput = z.input<typeof saveScorecardDto>;
export type SaveScorecardDto = z.output<typeof saveScorecardDto>;
