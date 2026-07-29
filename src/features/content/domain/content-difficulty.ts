export const CONTENT_DIFFICULTY = {
    easy: "Facile",
    hard: "Difficile",
    medium: "Moyen",
} as const;

export const CONTENT_DIFFICULTIES = [
    CONTENT_DIFFICULTY.easy,
    CONTENT_DIFFICULTY.medium,
    CONTENT_DIFFICULTY.hard,
] as const;

export type ContentDifficulty = (typeof CONTENT_DIFFICULTIES)[number];

export function isContentDifficulty(value: unknown): value is ContentDifficulty {
    return (
        typeof value === "string"
        && CONTENT_DIFFICULTIES.includes(value as ContentDifficulty)
    );
}

export function normalizeContentDifficulty(value: unknown): ContentDifficulty | null {
    return isContentDifficulty(value) ? value : null;
}
