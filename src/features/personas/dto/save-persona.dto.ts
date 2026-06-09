import { z } from "zod";
import { isOpenAIRealtimeVoiceId, type VoiceId } from "@/lib/openai/realtime-voices";

export const savePersonaDto = z.object({
    avatarUrl: z.string().trim().max(500, "L'URL de l'avatar est trop longue.").optional().default(""),
    company: z.string().trim().max(120, "Le nom de l'entreprise est trop long.").optional().default(""),
    name: z
        .string()
        .trim()
        .min(1, "Le nom du persona est requis.")
        .max(160, "Le nom du persona est trop long."),
    role: z.string().trim().max(120, "La fonction est trop longue.").optional().default(""),
    systemInstructions: z
        .string()
        .trim()
        .min(1, "Les instructions du persona sont requises."),
    voiceId: z
        .string()
        .refine(isOpenAIRealtimeVoiceId, { error: "La voix sélectionnée est invalide." })
        .transform((value) => value as VoiceId),
});

export type SavePersonaDto = z.infer<typeof savePersonaDto>;
