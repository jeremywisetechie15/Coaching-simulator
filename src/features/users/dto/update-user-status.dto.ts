import { z } from "zod";
import { USER_STATUS_ACTION } from "@/features/users/domain";

export const updateUserStatusDto = z.object({
    action: z.enum([USER_STATUS_ACTION.suspend, USER_STATUS_ACTION.reactivate]),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusDto>;
