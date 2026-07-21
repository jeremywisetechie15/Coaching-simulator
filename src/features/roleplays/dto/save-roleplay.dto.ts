import { z } from "zod";
import {
    CONTENT_STATUSES,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPES,
} from "@/features/content/domain";
import { QUIZ_PARTICIPATIONS } from "@/features/evaluations/domain";
import {
    ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH,
    ROLEPLAY_DIFFICULTIES,
    ROLEPLAY_DISC_PROFILES,
    ROLEPLAY_LEARNER_ROLE_MAX_LENGTH,
    getRoleplayPublicationIssues,
} from "@/features/roleplays/domain";
import { CONTENT_UPLOAD_RESOURCE_TYPES } from "@/lib/uploads/content-upload";

const optionalUuid = z.string().uuid("L'identifiant est invalide.").nullable().optional().default(null);
const optionalResourceId = z.string().uuid("La ressource sélectionnée est invalide.").optional();

const roleplayResourceDto = z
    .object({
        clientFileId: z.string().trim().max(120, "La référence du fichier est invalide.").optional().default(""),
        externalUrl: z.string().trim().max(1000, "L'URL de la ressource est trop longue.").optional().default(""),
        id: optionalResourceId,
        label: z.string().trim().max(180, "Le libellé de la ressource est trop long.").optional().default(""),
        resourceType: z.enum([...CONTENT_UPLOAD_RESOURCE_TYPES, "link"]).optional().default("document"),
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

        if ((resource.clientFileId || resource.storagePath) && resource.resourceType === "link") {
            ctx.addIssue({
                code: "custom",
                message: "Un fichier uploadé doit être de type document, image, audio ou vidéo.",
                path: ["resourceType"],
            });
        }
    })
    .transform((resource) => ({
        ...resource,
        label: resource.label || resource.externalUrl || resource.storagePath,
    }));

export const saveRoleplayDto = z
    .object({
        aiInstructions: z
            .string()
            .trim()
            .max(
                ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH,
                "Les instructions IA du scénario sont trop longues.",
            )
            .optional()
            .default(""),
        assignedUserId: optionalUuid,
        backgroundImagePath: z.string().trim().max(1000, "Le chemin de l'image de fond est trop long.").optional().default(""),
        category: z.string().trim().max(120, "La catégorie est trop longue.").optional().default(""),
        coachId: z.string().uuid("Le coach sélectionné est invalide.").nullable().optional().default(null),
        context: z.string().trim().max(4000, "Le contexte est trop long.").optional().default(""),
        description: z.string().trim().max(1200, "La description est trop longue.").optional().default(""),
        difficulty: z.enum(ROLEPLAY_DIFFICULTIES).nullable().optional().default(null),
        disc: z.enum(ROLEPLAY_DISC_PROFILES).optional().default("Stable"),
        domain: z.string().trim().max(120, "Le domaine est trop long.").optional().default(""),
        groupId: optionalUuid,
        learnerRole: z
            .string()
            .trim()
            .max(ROLEPLAY_LEARNER_ROLE_MAX_LENGTH, "Votre rôle est trop long.")
            .optional()
            .default(""),
        methodId: z.string().uuid("La méthode sélectionnée est invalide.").nullable().optional().default(null),
        objective: z.string().trim().max(2500, "L'objectif est trop long.").optional().default(""),
        obstacles: z.string().trim().max(2500, "Les objections sont trop longues.").optional().default(""),
        organizationId: optionalUuid,
        personaId: z
            .string()
            .uuid("Le persona sélectionné est invalide.")
            .nullable()
            .optional()
            .default(null),
        previewDescription: z
            .string()
            .trim()
            .max(500, "La description courte du roleplay est trop longue.")
            .optional()
            .default(""),
        previewTitle: z
            .string()
            .trim()
            .max(180, "Le titre preview du roleplay est trop long.")
            .optional()
            .default(""),
        quizIds: z
            .array(z.string().uuid("Le quiz sélectionné est invalide."))
            .optional()
            .default([])
            .transform((quizIds) => [...new Set(quizIds)]),
        quizParticipation: z.enum(QUIZ_PARTICIPATIONS).optional().default("optional"),
        resources: z.array(roleplayResourceDto).optional().default([]),
        scope: z.enum(CONTENT_VISIBILITY_SCOPES).optional().default(CONTENT_VISIBILITY_SCOPE.public),
        scorecardId: optionalUuid,
        status: z.enum(CONTENT_STATUSES).optional().default("draft"),
        title: z
            .string()
            .trim()
            .min(1, "Le titre du roleplay est requis.")
            .max(180, "Le titre du roleplay est trop long."),
    })
    .strict()
    .superRefine((roleplay, ctx) => {
        if (roleplay.status === "published") {
            for (const issue of getRoleplayPublicationIssues(roleplay)) {
                ctx.addIssue({
                    code: "custom",
                    message: issue.message,
                    path: [issue.field],
                });
            }
        }

        if (roleplay.scorecardId && !roleplay.methodId) {
            ctx.addIssue({
                code: "custom",
                message: "Une scorecard de roleplay doit être liée à une méthode.",
                path: ["methodId"],
            });
        }
    });

export type SaveRoleplayInput = z.input<typeof saveRoleplayDto>;
export type SaveRoleplayDto = z.output<typeof saveRoleplayDto>;
