import { extractNotationScore } from "./evaluation-notation.mapper";

function normalizedScore(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Résout le score à partir de la session demandée uniquement.
 * Les lignes normalisées de cette session sont prioritaires, puis son propre
 * notation_json historique reste lisible. Aucun score d'une autre tentative
 * n'entre dans cette décision.
 */
export function resolveRoleplaySessionEvaluationScore({
    notationJson,
    normalizedScorePercent,
}: {
    notationJson: unknown;
    normalizedScorePercent?: number | null;
}) {
    return normalizedScore(normalizedScorePercent) ?? extractNotationScore(notationJson) ?? 0;
}
