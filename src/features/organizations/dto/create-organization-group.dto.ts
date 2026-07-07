import { z } from "zod";

export const createOrganizationGroupDto = z.object({
    description: z.string().trim().max(500, "La description est trop longue.").optional().default(""),
    name: z
        .string()
        .trim()
        .min(1, "Le nom du groupe est requis.")
        .max(120, "Le nom du groupe est trop long."),
});

export type CreateOrganizationGroupDto = z.infer<typeof createOrganizationGroupDto>;
