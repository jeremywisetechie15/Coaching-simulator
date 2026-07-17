import { z } from "zod";

export const userContentAssignmentParamsDto = z.object({
    userId: z.string().uuid("L'utilisateur sélectionné est invalide."),
});

export const userContentAssignmentDto = z.object({
    contentId: z.string().uuid("Le contenu sélectionné est invalide."),
});

export type UserContentAssignmentDto = z.infer<typeof userContentAssignmentDto>;
