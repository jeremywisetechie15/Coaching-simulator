import {
    DISC_PROFILE,
    DISC_PROFILES_WITH_UNKNOWN,
    type DiscProfileValue,
} from "@/features/content/domain";

export const PERSONA_DISC_PROFILE = DISC_PROFILE;

export const PERSONA_DISC_PROFILES = DISC_PROFILES_WITH_UNKNOWN;

export type PersonaDiscProfile = DiscProfileValue;

export function isPersonaDiscProfile(value: unknown): value is PersonaDiscProfile {
    return typeof value === "string" && PERSONA_DISC_PROFILES.includes(value as PersonaDiscProfile);
}

export const PERSONA_DISC_PROFILE_OPTIONS: Array<{
    description: string;
    label: PersonaDiscProfile;
    value: PersonaDiscProfile;
}> = [
    {
        description: "Direct, résultats",
        label: PERSONA_DISC_PROFILE.dominant,
        value: PERSONA_DISC_PROFILE.dominant,
    },
    {
        description: "Sociable, enthousiaste",
        label: PERSONA_DISC_PROFILE.influential,
        value: PERSONA_DISC_PROFILE.influential,
    },
    {
        description: "Patient, fiable",
        label: PERSONA_DISC_PROFILE.stable,
        value: PERSONA_DISC_PROFILE.stable,
    },
    {
        description: "Précis, analytique",
        label: PERSONA_DISC_PROFILE.conscientious,
        value: PERSONA_DISC_PROFILE.conscientious,
    },
    {
        description: "Non spécifié",
        label: PERSONA_DISC_PROFILE.unknown,
        value: PERSONA_DISC_PROFILE.unknown,
    },
];
