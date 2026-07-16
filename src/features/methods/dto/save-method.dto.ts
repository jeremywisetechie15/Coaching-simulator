import { z } from "zod";
import { CONTENT_STATUSES } from "@/features/content/domain";
import {
    DEFAULT_METHOD_STEP_ICON,
    METHOD_RESOURCE_TYPES,
    METHOD_SCOPES,
    METHOD_STEP_ICONS,
} from "@/features/methods/domain/method";

const textArrayDto = z
    .array(z.string().trim().max(800, "Un élément de liste est trop long."))
    .optional()
    .default([])
    .transform((items) => items.filter((item) => item.length > 0));

const resourceDto = z
    .object({
        clientFileId: z.string().trim().max(120, "La référence du fichier est invalide.").optional().default(""),
        externalUrl: z.string().trim().max(1000, "L'URL de la ressource est trop longue.").optional().default(""),
        id: z.string().uuid("La ressource est invalide.").optional(),
        label: z.string().trim().max(160, "Le nom de la ressource est trop long.").optional().default(""),
        resourceType: z.enum(METHOD_RESOURCE_TYPES).optional().default("link"),
        storageBucket: z.string().trim().max(120, "Le bucket de la ressource est invalide.").optional().default(""),
        storagePath: z.string().trim().max(1000, "Le chemin de la ressource est trop long.").optional().default(""),
    })
    .superRefine((resource, ctx) => {
        if (resource.storageBucket && !resource.storagePath) {
            ctx.addIssue({
                code: "custom",
                message: "Le chemin du fichier uploadé est requis.",
                path: ["storagePath"],
            });
        }

        if (resource.storagePath && !resource.storageBucket) {
            ctx.addIssue({
                code: "custom",
                message: "Le bucket du fichier uploadé est requis.",
                path: ["storageBucket"],
            });
        }
    })
    .transform((resource) => ({
        ...resource,
        label: resource.label || resource.externalUrl || resource.storagePath,
    }));

const stepDto = z.object({
    bestPractices: textArrayDto,
    code: z.string().trim().max(20, "Le code de l'étape est trop long.").optional().default(""),
    id: z.string().uuid("L'étape est invalide.").optional(),
    icon: z.enum(METHOD_STEP_ICONS).optional().default(DEFAULT_METHOD_STEP_ICON),
    objectives: textArrayDto,
    pitfalls: textArrayDto,
    posture: textArrayDto,
    resources: z.array(resourceDto).optional().default([]),
    shortTitle: z.string().trim().max(120, "Le nom court de l'étape est trop long.").optional().default(""),
    stepKey: z.string().trim().max(120, "La clé de l'étape est trop longue.").optional().default(""),
    summary: z.string().trim().max(1200, "La description de l'étape est trop longue.").optional().default(""),
    takeaway: z.string().trim().max(500, "La description courte est trop longue.").optional().default(""),
    title: z
        .string()
        .trim()
        .min(1, "Le titre de chaque étape est requis.")
        .max(180, "Le titre de l'étape est trop long."),
    verbatims: textArrayDto,
});

export const saveMethodDto = z
    .object({
        category: z.string().trim().max(120, "La catégorie est trop longue.").optional().default(""),
        challenges: textArrayDto,
        description: z.string().trim().max(4000, "La description est trop longue.").optional().default(""),
        domain: z.string().trim().max(120, "Le domaine est trop long.").optional().default(""),
        name: z
            .string()
            .trim()
            .min(1, "Le nom de la méthode est requis.")
            .max(180, "Le nom de la méthode est trop long."),
        organizationId: z.string().uuid("L'organisation sélectionnée est invalide.").nullable().optional().default(null),
        objectives: textArrayDto,
        quizId: z.string().uuid("Le quiz associé est invalide.").nullable().optional().default(null),
        readingTimeMinutes: z
            .number()
            .int("Le temps de lecture doit être un nombre entier.")
            .min(0, "Le temps de lecture ne peut pas être négatif.")
            .nullable()
            .optional()
            .default(null),
        resources: z.array(resourceDto).optional().default([]),
        scope: z.enum(METHOD_SCOPES).optional().default("public"),
        status: z.enum(CONTENT_STATUSES).optional().default("draft"),
        steps: z.array(stepDto).min(1, "Une méthode doit contenir au moins une étape."),
        subtitle: z.string().trim().max(220, "Le sous-titre est trop long.").optional().default(""),
        tag: z.string().trim().max(120, "Le tag est trop long.").optional().default(""),
    })
    .strict()
    .superRefine((method, ctx) => {
        if (method.scope === "organization" && !method.organizationId) {
            ctx.addIssue({
                code: "custom",
                message: "Une méthode privée doit être liée à une organisation.",
                path: ["organizationId"],
            });
        }

        method.resources.forEach((resource, index) => {
            if ((resource.storagePath || resource.clientFileId) && resource.resourceType !== "document") {
                ctx.addIssue({
                    code: "custom",
                    message: "Les ressources complémentaires uploadées doivent être des documents.",
                    path: ["resources", index, "resourceType"],
                });
            }
        });
    });

export type SaveMethodInput = z.input<typeof saveMethodDto>;
export type SaveMethodDto = z.output<typeof saveMethodDto>;
