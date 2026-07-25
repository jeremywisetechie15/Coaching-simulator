import { z } from "zod";

export const resendOrganizationInvitationParamsDto = z.object({
    organizationId: z.string().trim().uuid(),
    userId: z.string().trim().uuid(),
});
