import { z } from "zod";
import {
    CONTENT_STATUSES,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPES,
} from "@/features/content/domain";
import { QUIZ_PARTICIPATIONS } from "@/features/evaluations/domain";
import { ROLEPLAY_DIFFICULTIES, ROLEPLAY_DISC_PROFILES } from "@/features/roleplays/domain";
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
        assignedUserId: optionalUuid,
        category: z.string().trim().max(120, "La catégorie est trop longue.").optional().default(""),
        coachId: z.string().uuid("Le coach sélectionné est invalide.").nullable().optional().default(null),
        context: z.string().trim().max(4000, "Le contexte est trop long.").optional().default(""),
        description: z.string().trim().max(1200, "La description est trop longue.").optional().default(""),
        difficulty: z.enum(ROLEPLAY_DIFFICULTIES).optional().default("Moyen"),
        disc: z.enum(ROLEPLAY_DISC_PROFILES).optional().default("Stable"),
        domain: z.string().trim().max(120, "Le domaine est trop long.").optional().default(""),
        groupId: optionalUuid,
        methodId: z.string().uuid("La méthode sélectionnée est invalide.").nullable().optional().default(null),
        objective: z.string().trim().max(2500, "L'objectif est trop long.").optional().default(""),
        obstacles: z.string().trim().max(2500, "Les objections sont trop longues.").optional().default(""),
        organizationId: optionalUuid,
        personaId: z.string().uuid("Le persona sélectionné est invalide."),
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
        if (roleplay.scope === CONTENT_VISIBILITY_SCOPE.organization && !roleplay.organizationId) {
            ctx.addIssue({
                code: "custom",
                message: "Un roleplay privé organisation doit être lié à une organisation.",
                path: ["organizationId"],
            });
        }

        if (roleplay.scope === CONTENT_VISIBILITY_SCOPE.group) {
            if (!roleplay.organizationId) {
                ctx.addIssue({
                    code: "custom",
                    message: "Un roleplay privé groupe doit être lié à une organisation.",
                    path: ["organizationId"],
                });
            }

            if (!roleplay.groupId) {
                ctx.addIssue({
                    code: "custom",
                    message: "Un roleplay privé groupe doit être lié à un groupe.",
                    path: ["groupId"],
                });
            }
        }

        if (roleplay.scope === CONTENT_VISIBILITY_SCOPE.user && !roleplay.assignedUserId) {
            ctx.addIssue({
                code: "custom",
                message: "Un roleplay privé utilisateur doit être lié à un utilisateur.",
                path: ["assignedUserId"],
            });
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
