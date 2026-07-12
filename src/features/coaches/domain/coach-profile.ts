export const COACHING_STYLE = {
    demanding: "Exigeant",
    optimistic: "Optimiste",
    realistic: "Réaliste",
} as const;

export const COACHING_STYLES = [
    COACHING_STYLE.optimistic,
    COACHING_STYLE.realistic,
    COACHING_STYLE.demanding,
] as const;

export type CoachingStyle = (typeof COACHING_STYLES)[number];

export const COACHING_STYLE_OPTIONS: Array<{
    description: string;
    label: CoachingStyle;
    value: CoachingStyle;
}> = [
    {
        description: "Encourageant et positif",
        label: COACHING_STYLE.optimistic,
        value: COACHING_STYLE.optimistic,
    },
    {
        description: "Pragmatique et factuel",
        label: COACHING_STYLE.realistic,
        value: COACHING_STYLE.realistic,
    },
    {
        description: "Pousse à l'excellence",
        label: COACHING_STYLE.demanding,
        value: COACHING_STYLE.demanding,
    },
];

export const COACH_DISC_PROFILE = DISC_PROFILE;

export const COACH_DISC_PROFILES = DISC_PROFILES;

export type CoachDiscProfile = DiscProfile;

export const COACH_DISC_PROFILE_OPTIONS: Array<{
    description: string;
    label: CoachDiscProfile;
    value: CoachDiscProfile;
}> = [
    {
        description: "Direct et orienté résultats",
        label: COACH_DISC_PROFILE.dominant,
        value: COACH_DISC_PROFILE.dominant,
    },
    {
        description: "Enthousiaste et sociable",
        label: COACH_DISC_PROFILE.influential,
        value: COACH_DISC_PROFILE.influential,
    },
    {
        description: "Patient et fiable",
        label: COACH_DISC_PROFILE.stable,
        value: COACH_DISC_PROFILE.stable,
    },
    {
        description: "Précis et analytique",
        label: COACH_DISC_PROFILE.conscientious,
        value: COACH_DISC_PROFILE.conscientious,
    },
];
import {
    DISC_PROFILE,
    DISC_PROFILES,
    type DiscProfile,
} from "@/features/content/domain";
