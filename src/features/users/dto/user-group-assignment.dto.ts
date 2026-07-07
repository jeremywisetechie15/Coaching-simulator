import { z } from "zod";

export const userGroupAssignmentDto = z.object({
    groupId: z.string().uuid("Le groupe sélectionné est invalide."),
});

export type UserGroupAssignmentDto = z.infer<typeof userGroupAssignmentDto>;
