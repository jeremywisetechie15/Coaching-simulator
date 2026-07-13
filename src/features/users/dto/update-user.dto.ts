import { z } from "zod";
import { USER_ROLES } from "@/features/users/domain";

export const updateUserDto = z.object({
    firstName: z.string().trim().min(1, "Le prénom est requis.").max(80, "Le prénom est trop long."),
    lastName: z.string().trim().min(1, "Le nom est requis.").max(80, "Le nom est trop long."),
    role: z.enum(USER_ROLES),
});

export type UpdateUserDto = z.infer<typeof updateUserDto>;
