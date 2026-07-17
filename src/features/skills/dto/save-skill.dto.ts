import { z } from "zod";
import {
    CONTENT_STATUSES,
    CONTENT_VISIBILITY_SCOPES,
    isContentCategoryForDomain,
    isContentDomain,
} from "@/features/content/domain";
import { SKILL_DIMENSIONS, SKILL_TYPES } from "@/features/skills/domain/skills";

const dimensionItemInputDto = z
    .object({
        id: z.string().uuid("L'item de dimension est invalide.").optional(),
        label: z.string().trim().max(800, "L'item de dimension est trop long.").optional().default(""),
    })
    .strict();

const dimensionItemsDto = z
    .object({
        savoir: z.array(dimensionItemInputDto).optional().default([]),
        savoir_etre: z.array(dimensionItemInputDto).optional().default([]),
        savoir_faire: z.array(dimensionItemInputDto).optional().default([]),
    })
    .strict()
    .transform((dimensions) => ({
        savoir: dimensions.savoir.filter((item) => item.label.length > 0),
        savoir_etre: dimensions.savoir_etre.filter((item) => item.label.length > 0),
        savoir_faire: dimensions.savoir_faire.filter((item) => item.label.length > 0),
    }));

const optionalUuidDto = (message: string) =>
    z
        .string()
        .trim()
        .uuid(message)
        .or(z.literal(""))
        .nullable()
        .optional()
        .default(null)
        .transform((value) => value || null);

const optionalSkillDomainDto = z
    .string()
    .trim()
    .max(120, "Le domaine est trop long.")
    .refine((domain) => !domain || isContentDomain(domain), "Le domaine sélectionné est invalide.")
    .optional()
    .default("");

export const saveSkillDto = z
    .object({
        category: z.string().trim().max(120, "La catégorie est trop longue.").optional().default(""),
        description: z.string().trim().max(4000, "La description est trop longue.").optional().default(""),
        dimensionItems: dimensionItemsDto.optional().default({
            savoir: [],
            savoir_etre: [],
            savoir_faire: [],
        }),
        assignedUserId: optionalUuidDto("L'utilisateur sélectionné est invalide."),
        domain: optionalSkillDomainDto,
        groupId: optionalUuidDto("Le groupe sélectionné est invalide."),
        id: z
            .string()
            .trim()
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "L'identifiant de compétence est invalide.")
            .max(120, "L'identifiant de compétence est trop long.")
            .optional()
            .default(""),
        name: z
            .string()
            .trim()
            .min(1, "Le nom de la compétence est requis.")
            .max(180, "Le nom de la compétence est trop long."),
        organizationId: optionalUuidDto("L'organisation sélectionnée est invalide."),
        scope: z.enum(CONTENT_VISIBILITY_SCOPES).optional().default("public"),
        status: z.enum(CONTENT_STATUSES).optional().default("draft"),
        type: z.enum(SKILL_TYPES).optional().default("Métier"),
    })
    .strict()
    .superRefine((skill, ctx) => {
        if (skill.category && !skill.domain) {
            ctx.addIssue({
                code: "custom",
                message: "Sélectionnez un domaine avant la catégorie.",
                path: ["category"],
            });
        } else if (skill.category && !isContentCategoryForDomain(skill.domain, skill.category)) {
            ctx.addIssue({
                code: "custom",
                message: "La catégorie ne correspond pas au domaine sélectionné.",
                path: ["category"],
            });
        }

        if (skill.scope === "organization" && !skill.organizationId) {
            ctx.addIssue({
                code: "custom",
                message: "L'organisation est requise pour une compétence privée organisation.",
                path: ["organizationId"],
            });
        }

        if (skill.scope === "group") {
            if (!skill.organizationId) {
                ctx.addIssue({
                    code: "custom",
                    message: "L'organisation est requise pour une compétence privée groupe.",
                    path: ["organizationId"],
                });
            }

            if (!skill.groupId) {
                ctx.addIssue({
                    code: "custom",
                    message: "Le groupe est requis pour une compétence privée groupe.",
                    path: ["groupId"],
                });
            }
        }

        if (skill.scope === "user" && !skill.assignedUserId) {
            ctx.addIssue({
                code: "custom",
                message: "L'utilisateur est requis pour une compétence privée utilisateur.",
                path: ["assignedUserId"],
            });
        }

        if (skill.status !== "published") {
            return;
        }

        for (const dimension of SKILL_DIMENSIONS) {
            if (skill.dimensionItems[dimension].length === 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Chaque dimension doit contenir au moins un item pour publier une compétence.",
                    path: ["dimensionItems", dimension],
                });
            }
        }
    });

export type SaveSkillInput = z.input<typeof saveSkillDto>;
export type SaveSkillDto = z.output<typeof saveSkillDto>;
