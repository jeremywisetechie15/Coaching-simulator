export const ROLEPLAY_INDEX_RECENT_SESSION_LIMIT = 6;
export const ROLEPLAY_INDEX_BEST_SESSION_COUNT = 3;
export const ROLEPLAY_INDEX_DESCRIPTION =
    `Moyenne des ${ROLEPLAY_INDEX_BEST_SESSION_COUNT} meilleurs scores parmi les ` +
    `${ROLEPLAY_INDEX_RECENT_SESSION_LIMIT} dernières simulations éligibles. ` +
    `Avec moins de ${ROLEPLAY_INDEX_BEST_SESSION_COUNT} simulations, toutes les simulations disponibles sont retenues.`;

export type RoleplayIndexTrend = "up" | "down" | "stable" | "unavailable";

export interface RoleplayIndexResult {
    delta: number | null;
    score: number | null;
    sessionCount: number;
    trend: RoleplayIndexTrend;
}

export interface RoleplayIndexSession {
    completedAt: string | null;
    durationSeconds: number | null;
    indexScore: number;
    isTopScore: boolean;
    score: number;
    sessionId: string;
}

function normalizeScore(score: number) {
    return Math.max(0, Math.min(100, score));
}

export function selectRoleplayIndexScorePositions(scoresByRecency: number[]) {
    return scoresByRecency
        .slice(0, ROLEPLAY_INDEX_RECENT_SESSION_LIMIT)
        .map((score, position) => ({ position, score }))
        .filter(({ score }) => Number.isFinite(score))
        .map(({ position, score }) => ({ position, score: normalizeScore(score) }))
        .sort((first, second) => second.score - first.score || first.position - second.position)
        .slice(0, ROLEPLAY_INDEX_BEST_SESSION_COUNT)
        .map(({ position }) => position);
}

function averageBestScores(scores: number[]) {
    if (scores.length === 0) return null;

    const recentScores = scores.slice(0, ROLEPLAY_INDEX_RECENT_SESSION_LIMIT);
    const bestScores = selectRoleplayIndexScorePositions(recentScores).map((position) => recentScores[position]);

    return Math.round(bestScores.reduce((total, score) => total + score, 0) / bestScores.length);
}

export function getRoleplayIndexTrend(delta: number | null): RoleplayIndexTrend {
    if (delta === null) return "unavailable";
    if (delta > 0) return "up";
    if (delta < 0) return "down";
    return "stable";
}

/**
 * L'INDEX est la moyenne des 3 meilleurs scores parmi les 6 dernières simulations éligibles.
 * Avec moins de 3 simulations, toutes les simulations disponibles sont retenues.
 */
export function calculateRoleplayIndex(scoresByRecency: number[]): RoleplayIndexResult {
    const scores = scoresByRecency.filter(Number.isFinite).map(normalizeScore);
    const recentScores = scores.slice(0, ROLEPLAY_INDEX_RECENT_SESSION_LIMIT);
    const score = averageBestScores(recentScores);
    const previousScore = averageBestScores(scores.slice(1, ROLEPLAY_INDEX_RECENT_SESSION_LIMIT + 1));
    const delta = score === null || previousScore === null ? null : score - previousScore;

    return {
        delta,
        score,
        sessionCount: recentScores.length,
        trend: getRoleplayIndexTrend(delta),
    };
}

/** Calcule l'INDEX disponible après chacune des dernières simulations, de la plus récente à la plus ancienne. */
export function calculateRoleplayIndexSeries(scoresByRecency: number[], pointCount = ROLEPLAY_INDEX_RECENT_SESSION_LIMIT) {
    return scoresByRecency
        .slice(0, pointCount)
        .map((_, position) => calculateRoleplayIndex(scoresByRecency.slice(position)).score ?? 0);
}
