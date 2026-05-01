import { z } from "zod";

export const createOrganizationDto = z.object({
    contactEmail: z
        .string()
        .trim()
        .email("L'email de contact est invalide.")
        .or(z.literal(""))
        .optional()
        .default(""),
    industry: z.string().trim().max(120, "Le secteur d'activité est trop long.").optional().default(""),
    name: z
        .string()
        .trim()
        .min(1, "Le nom de l'entreprise est requis.")
        .max(120, "Le nom de l'entreprise est trop long."),
    phone: z.string().trim().max(40, "Le téléphone est trop long.").optional().default(""),
    region: z.string().trim().max(80, "La région est trop longue.").optional().default(""),
    status: z.enum(["active", "suspended"], {
        error: "Le statut est invalide.",
    }),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationDto>;
