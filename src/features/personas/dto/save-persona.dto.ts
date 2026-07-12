import { z } from "zod";
import { isOpenAIRealtimeVoiceId, type VoiceId } from "@/lib/openai/realtime-voices";
import {
    PERSONA_BUSINESS_SECTORS,
    PERSONA_DISC_PROFILE,
    PERSONA_DISC_PROFILES,
} from "@/features/personas/domain/persona-profile";

const optionalString = (max: number, message: string) =>
    z.string().trim().max(max, message).optional().default("");

const optionalIntegerString = (message: string, options: { max?: number } = {}) =>
    z
        .string()
        .trim()
        .regex(/^\d*$/, message)
        .max(9, message)
        .refine((value) => !value || options.max === undefined || Number(value) <= options.max, {
            message,
        })
        .optional()
        .default("");

export const savePersonaDto = z.object({
    age: optionalIntegerString("L'âge doit être un nombre entier positif inférieur ou égal à 130.", { max: 130 }),
    annualRevenue: optionalString(120, "Le chiffre d'affaires est trop long."),
    avatarUrl: z.string().trim().max(500, "L'URL de l'avatar est trop longue.").optional().default(""),
    childrenCount: optionalIntegerString("Le nombre d'enfants doit être un nombre entier positif."),
    company: z.string().trim().max(120, "Le nom de l'entreprise est trop long.").optional().default(""),
    companyDescription: optionalString(2000, "Le descriptif de l'entreprise est trop long."),
    diploma: optionalString(160, "Le diplôme est trop long."),
    discProfile: z.enum(PERSONA_DISC_PROFILES).optional().default(PERSONA_DISC_PROFILE.stable),
    employeeCount: optionalIntegerString("Le nombre d'employés doit être un nombre entier positif."),
    industry: z.union([z.enum(PERSONA_BUSINESS_SECTORS), z.literal("")]).optional().default(""),
    maritalStatus: optionalString(120, "Le statut marital est trop long."),
    name: z
        .string()
        .trim()
        .min(1, "Le nom du persona est requis.")
        .max(160, "Le nom du persona est trop long."),
    nationality: optionalString(120, "La nationalité est trop longue."),
    netIncomeBeforeTax: optionalString(120, "Le revenu net avant impôt est trop long."),
    residenceCountry: optionalString(120, "Le pays de résidence est trop long."),
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
