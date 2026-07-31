export const CONTENT_SCORE_STATUS = {
    danger: "danger",
    success: "success",
    warning: "warning",
} as const;

export type ContentScoreStatus =
    (typeof CONTENT_SCORE_STATUS)[keyof typeof CONTENT_SCORE_STATUS];

/**
 * Un score atteint le statut validé dès le seuil propre au contenu.
 * Sous ce seuil, 50 % sépare les résultats à renforcer des résultats critiques.
 */
export const CONTENT_SCORE_WARNING_MINIMUM_PERCENT = 50;

function normalizePercent(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

export function getContentScoreStatus(
    score: number,
    validationThreshold: number,
): ContentScoreStatus {
    const normalizedScore = normalizePercent(score);
    const normalizedThreshold = normalizePercent(validationThreshold);

    if (normalizedScore >= normalizedThreshold) {
        return CONTENT_SCORE_STATUS.success;
    }

    return normalizedScore >= CONTENT_SCORE_WARNING_MINIMUM_PERCENT
        ? CONTENT_SCORE_STATUS.warning
        : CONTENT_SCORE_STATUS.danger;
}
