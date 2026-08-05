/**
 * Paliers pédagogiques fixes pour les étapes, critères et compétences.
 * La validation globale d'un scénario utilise son `validationThreshold`.
 */
export const ROLEPLAY_MASTERY_THRESHOLD_PERCENT = 80;
export const ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT = 60;
export const ROLEPLAY_REINFORCEMENT_THRESHOLD_PERCENT = 40;

/** Valeur par défaut des scénarios existants et des créations sans seuil explicite. */
export const ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT = 80;

export type ScoreLevel = "green" | "yellow" | "orange" | "red";

export function normalizeRoleplayValidationThreshold(value: unknown) {
    if (typeof value !== "number" || !Number.isInteger(value)) {
        return ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT;
    }

    return Math.max(0, Math.min(100, value));
}

export function scoreLevel(
    score: number,
    greenThreshold = ROLEPLAY_MASTERY_THRESHOLD_PERCENT,
): ScoreLevel {
    if (score >= greenThreshold) return "green";
    if (score >= ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT) return "yellow";
    if (score >= ROLEPLAY_REINFORCEMENT_THRESHOLD_PERCENT) return "orange";
    return "red";
}
