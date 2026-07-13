export const ROLEPLAY_NOTATION_FEEDBACK_MESSAGES = {
    generationError: "Impossible de générer l'évaluation complète.",
    generationSuccess: "Évaluation générée avec succès.",
    ineligible: "Cette session est sauvegardée, mais elle est trop courte pour être évaluée.",
    regenerationError: "Impossible de relancer la notation de cette session.",
    regenerationSuccess: "Notation mise à jour avec succès.",
    scorecardServerError: "Erreur lors de la notation scorecard.",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function getRoleplayNotationApiErrorMessage(
    payload: unknown,
    fallback: string = ROLEPLAY_NOTATION_FEEDBACK_MESSAGES.generationError,
) {
    if (!isRecord(payload)) return fallback;

    return nonEmptyString(payload.details)
        ?? nonEmptyString(payload.error)
        ?? fallback;
}
