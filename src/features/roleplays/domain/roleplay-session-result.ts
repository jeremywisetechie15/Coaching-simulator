import {
    normalizeRoleplayValidationThreshold,
    scoreLevel,
    type ScoreLevel,
} from "./roleplay-score";

export type RoleplaySessionResultLevel = ScoreLevel | "neutral";

export interface RoleplaySessionResultFeedback {
    description: string;
    level: RoleplaySessionResultLevel;
    scorePercent: number | null;
    thresholdPercent: number;
    title: string;
}

function normalizeScorePercent(value: number | null) {
    if (value === null || !Number.isFinite(value)) return null;
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function getRoleplaySessionResultFeedback(
    scorePercent: number | null,
    validationThreshold: number,
): RoleplaySessionResultFeedback {
    const score = normalizeScorePercent(scorePercent);
    const threshold = normalizeRoleplayValidationThreshold(validationThreshold);

    if (score === null) {
        return {
            description: "Votre notation détaillée est maintenant disponible.",
            level: "neutral",
            scorePercent: null,
            thresholdPercent: threshold,
            title: "Évaluation prête",
        };
    }

    const level = scoreLevel(score, threshold);

    if (level === "green") {
        return {
            description: `Vous avez atteint le seuil de validation fixé à ${threshold} %.`,
            level,
            scorePercent: score,
            thresholdPercent: threshold,
            title: "Bravo, objectif atteint !",
        };
    }

    if (level === "yellow") {
        const missingPoints = Math.max(1, threshold - score);
        return {
            description: `Il vous manque ${missingPoints} ${missingPoints > 1 ? "points" : "point"} pour atteindre le seuil de ${threshold} %.`,
            level,
            scorePercent: score,
            thresholdPercent: threshold,
            title: "Bon travail, vous vous rapprochez de l’objectif",
        };
    }

    if (level === "orange") {
        return {
            description: `Consultez la notation pour identifier les priorités qui vous mèneront au seuil de ${threshold} %.`,
            level,
            scorePercent: score,
            thresholdPercent: threshold,
            title: "Les bases sont en place",
        };
    }

    return {
        description: `La notation vous indique les fondamentaux à renforcer pour progresser vers le seuil de ${threshold} %.`,
        level,
        scorePercent: score,
        thresholdPercent: threshold,
        title: "Une première étape pour progresser",
    };
}
