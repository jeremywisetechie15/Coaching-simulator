export const DISC_PROFILE = {
    conscientious: "Consciencieux",
    dominant: "Dominant",
    influential: "Influent",
    stable: "Stable",
    unknown: "Inconnu",
} as const;

export const DISC_PROFILES = [
    DISC_PROFILE.dominant,
    DISC_PROFILE.influential,
    DISC_PROFILE.stable,
    DISC_PROFILE.conscientious,
] as const;

export const DISC_PROFILES_WITH_UNKNOWN = [
    ...DISC_PROFILES,
    DISC_PROFILE.unknown,
] as const;

export type DiscProfile = (typeof DISC_PROFILES)[number];
export type DiscProfileValue = (typeof DISC_PROFILES_WITH_UNKNOWN)[number];
export type DiscProfileTone = "blue" | "green" | "neutral" | "red" | "yellow";

const DISC_PROFILE_TONES: Record<DiscProfileValue, DiscProfileTone> = {
    [DISC_PROFILE.dominant]: "red",
    [DISC_PROFILE.influential]: "yellow",
    [DISC_PROFILE.stable]: "green",
    [DISC_PROFILE.conscientious]: "blue",
    [DISC_PROFILE.unknown]: "neutral",
};

export function getDiscProfileTone(profile: DiscProfileValue) {
    return DISC_PROFILE_TONES[profile];
}
