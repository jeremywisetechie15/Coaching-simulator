import { z } from "zod";
import { ORGANIZATION_MEMBER_ROLES } from "@/features/organizations/domain/organization-member";

export const inviteOrganizationUserDto = z.object({
    email: z.string().trim().email("L'email est invalide."),
    firstName: z.string().trim().min(1, "Le prénom est requis.").max(80, "Le prénom est trop long."),
    groupId: z.string().trim().uuid("Le groupe est invalide.").or(z.literal("")).optional().default(""),
    lastName: z.string().trim().min(1, "Le nom est requis.").max(80, "Le nom est trop long."),
    role: z.enum(ORGANIZATION_MEMBER_ROLES, {
        error: "Le rôle est invalide.",
    }),
});

export type InviteOrganizationUserDto = z.infer<typeof inviteOrganizationUserDto>;
