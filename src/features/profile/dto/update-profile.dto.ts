import { z } from "zod";
import {
    isActivitySectorCode,
    type ActivitySectorCode,
} from "@/features/profile/domain/activity-sector";

export const updateProfileDto = z.object({
    activitySectorCode: z
        .custom<ActivitySectorCode>(isActivitySectorCode, {
            message: "Le secteur d’activité est invalide.",
        })
        .nullable()
        .optional(),
    avatarPath: z.string().trim().max(500, "Le chemin de l'avatar est trop long.").nullable().optional(),
    bio: z.string().trim().max(800, "La bio est trop longue.").optional().default(""),
    firstName: z.string().trim().min(1, "Le prénom est requis.").max(80, "Le prénom est trop long."),
    lastName: z.string().trim().min(1, "Le nom est requis.").max(80, "Le nom est trop long."),
});

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
