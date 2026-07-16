import { z } from "zod";
import { isOpenAIRealtimeVoiceId, type VoiceId } from "@/lib/openai/realtime-voices";
import {
    COACH_DISC_PROFILE,
    COACH_DISC_PROFILES,
    COACHING_STYLE,
    COACHING_STYLES,
} from "@/features/coaches/domain/coach-profile";
import { CONTENT_DOMAINS, CONTENT_STATUSES } from "@/features/content/domain";

const optionalString = (max: number, message: string) =>
    z.string().trim().max(max, message).optional().default("");

export const saveCoachDto = z.object({
    avatarSrc: z.string().trim().max(500, "L'URL de l'avatar est trop longue.").optional().default(""),
    backgroundImagePath: optionalString(1000, "Le chemin de l'image de fond est trop long."),
    certifications: optionalString(1200, "Les certifications obtenues sont trop longues."),
    coachingStyle: z.enum(COACHING_STYLES).optional().default(COACHING_STYLE.optimistic),
    diploma: optionalString(800, "Le diplôme est trop long."),
    discProfile: z.enum(COACH_DISC_PROFILES).optional().default(COACH_DISC_PROFILE.stable),
    expertiseDomain: z.union([z.enum(CONTENT_DOMAINS), z.literal("")]).optional().default(""),
    name: z
        .string()
        .trim()
        .min(1, "Le nom du coach est requis.")
        .max(160, "Le nom du coach est trop long."),
    status: z.enum(CONTENT_STATUSES).default("published"),
    systemInstructions: z
        .string()
        .trim()
        .min(1, "Les instructions du coach sont requises."),
    voiceId: z
        .string()
        .refine(isOpenAIRealtimeVoiceId, { error: "La voix sélectionnée est invalide." })
        .transform((value) => value as VoiceId),
});

export type SaveCoachDto = z.infer<typeof saveCoachDto>;
