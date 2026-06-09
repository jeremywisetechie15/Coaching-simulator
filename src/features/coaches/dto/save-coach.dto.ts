import { z } from "zod";
import { isOpenAIRealtimeVoiceId, type VoiceId } from "@/lib/openai/realtime-voices";

export const saveCoachDto = z.object({
    avatarSrc: z.string().trim().max(500, "L'URL de l'avatar est trop longue.").optional().default(""),
    name: z
        .string()
        .trim()
        .min(1, "Le nom du coach est requis.")
        .max(160, "Le nom du coach est trop long."),
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
