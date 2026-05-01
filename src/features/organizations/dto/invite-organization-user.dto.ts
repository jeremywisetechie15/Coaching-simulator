import { z } from "zod";

export const inviteOrganizationUserDto = z.object({
    email: z.string().trim().email("L'email est invalide."),
    firstName: z.string().trim().min(1, "Le prénom est requis.").max(80, "Le prénom est trop long."),
    groupId: z.string().trim().optional().default(""),
    lastName: z.string().trim().min(1, "Le nom est requis.").max(80, "Le nom est trop long."),
    role: z.enum(["member", "manager"], {
        error: "Le rôle est invalide.",
    }),
});

export type InviteOrganizationUserDto = z.infer<typeof inviteOrganizationUserDto>;
