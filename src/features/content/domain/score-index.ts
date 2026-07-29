export const SCORE_INDEX_RECENT_RESULT_LIMIT = 6;
export const SCORE_INDEX_BEST_RESULT_COUNT = 3;
export const SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT = SCORE_INDEX_BEST_RESULT_COUNT;
export const SCORE_INDEX_LABEL = "Score INDEX";

export type ScoreIndexTrend = "up" | "down" | "stable" | "unavailable";
export type ScoreIndexDisplayState = "available" | "empty" | "pending";

export interface ScoreIndexResult {
    delta: number | null;
    score: number | null;
    resultCount: number;
    trend: ScoreIndexTrend;
}

export function getScoreIndexDisplayState(resultCount: number): ScoreIndexDisplayState {
    if (!Number.isFinite(resultCount) || resultCount <= 0) return "empty";
    if (resultCount < SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT) return "pending";
    return "available";
}

function normalizeScore(score: number) {
    return Math.max(0, Math.min(100, score));
}

export function selectScoreIndexPositions(scoresByRecency: number[]) {
    return scoresByRecency
        .slice(0, SCORE_INDEX_RECENT_RESULT_LIMIT)
        .map((score, position) => ({ position, score }))
        .filter(({ score }) => Number.isFinite(score))
        .map(({ position, score }) => ({ position, score: normalizeScore(score) }))
        .sort((first, second) => second.score - first.score || first.position - second.position)
        .slice(0, SCORE_INDEX_BEST_RESULT_COUNT)
        .map(({ position }) => position);
}

function averageBestScores(scores: number[]) {
    if (scores.length === 0) return null;

    const recentScores = scores.slice(0, SCORE_INDEX_RECENT_RESULT_LIMIT);
    const bestScores = selectScoreIndexPositions(recentScores).map(
        (position) => recentScores[position],
    );

    return Math.round(bestScores.reduce((total, score) => total + score, 0) / bestScores.length);
}

export function getScoreIndexTrend(delta: number | null): ScoreIndexTrend {
    if (delta === null) return "unavailable";
    if (delta > 0) return "up";
    if (delta < 0) return "down";
    return "stable";
}

export function calculateScoreIndex(scoresByRecency: number[]): ScoreIndexResult {
    const scores = scoresByRecency.filter(Number.isFinite).map(normalizeScore);
    const recentScores = scores.slice(0, SCORE_INDEX_RECENT_RESULT_LIMIT);
    const score = averageBestScores(recentScores);
    const previousScore = averageBestScores(
        scores.slice(1, SCORE_INDEX_RECENT_RESULT_LIMIT + 1),
    );
    const delta = score === null || previousScore === null ? null : score - previousScore;

    return {
        delta,
        score,
        resultCount: recentScores.length,
        trend: getScoreIndexTrend(delta),
    };
}

export function calculateScoreIndexSeries(
    scoresByRecency: number[],
    pointCount = SCORE_INDEX_RECENT_RESULT_LIMIT,
) {
    return scoresByRecency
        .slice(0, pointCount)
        .map((_, position) => calculateScoreIndex(scoresByRecency.slice(position)).score ?? 0);
}
