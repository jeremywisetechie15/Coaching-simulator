export const PERSONA_DISC_PROFILE = {
    conscientious: "Consciencieux",
    dominant: "Dominant",
    influential: "Influent",
    stable: "Stable",
    unknown: "Inconnu",
} as const;

export const PERSONA_DISC_PROFILES = [
    PERSONA_DISC_PROFILE.dominant,
    PERSONA_DISC_PROFILE.influential,
    PERSONA_DISC_PROFILE.stable,
    PERSONA_DISC_PROFILE.conscientious,
    PERSONA_DISC_PROFILE.unknown,
] as const;

export type PersonaDiscProfile = (typeof PERSONA_DISC_PROFILES)[number];

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

export const PERSONA_BUSINESS_SECTORS = [
    "Nettoyage industriel",
    "Restauration",
    "Profession libérale santé",
    "Technologie",
    "Services informatiques",
    "Commerce",
    "Industrie",
    "Conseil",
    "Finance",
    "Immobilier",
    "Autre",
] as const;

export type PersonaBusinessSector = (typeof PERSONA_BUSINESS_SECTORS)[number];
