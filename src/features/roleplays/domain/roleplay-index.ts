import {
    SCORE_INDEX_BEST_RESULT_COUNT,
    SCORE_INDEX_LABEL,
    SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT,
    SCORE_INDEX_RECENT_RESULT_LIMIT,
    calculateScoreIndex,
    calculateScoreIndexSeries,
    getScoreIndexDisplayState,
    getScoreIndexTrend,
    selectScoreIndexPositions,
    type ScoreIndexDisplayState,
    type ScoreIndexTrend,
} from "@/features/content/domain";

export const ROLEPLAY_INDEX_RECENT_SESSION_LIMIT = SCORE_INDEX_RECENT_RESULT_LIMIT;
export const ROLEPLAY_INDEX_BEST_SESSION_COUNT = SCORE_INDEX_BEST_RESULT_COUNT;
export const ROLEPLAY_INDEX_MINIMUM_VISIBLE_SESSION_COUNT =
    SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT;
export const ROLEPLAY_INDEX_LABEL = SCORE_INDEX_LABEL;
export const ROLEPLAY_INDEX_TITLE = `Mon ${ROLEPLAY_INDEX_LABEL}`;
export const ROLEPLAY_INDEX_DESCRIPTION =
    `${ROLEPLAY_INDEX_LABEL} disponible à partir de ${ROLEPLAY_INDEX_MINIMUM_VISIBLE_SESSION_COUNT} simulations éligibles. ` +
    `Il correspond à la moyenne des ${ROLEPLAY_INDEX_BEST_SESSION_COUNT} meilleurs scores parmi les ` +
    `${ROLEPLAY_INDEX_RECENT_SESSION_LIMIT} dernières simulations éligibles.`;

export type RoleplayIndexTrend = ScoreIndexTrend;
export type RoleplayIndexDisplayState = ScoreIndexDisplayState;

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

export function getRoleplayIndexDisplayState(
    sessionCount: number,
): RoleplayIndexDisplayState {
    return getScoreIndexDisplayState(sessionCount);
}

export function selectRoleplayIndexScorePositions(scoresByRecency: number[]) {
    return selectScoreIndexPositions(scoresByRecency);
}

export function getRoleplayIndexTrend(delta: number | null): RoleplayIndexTrend {
    return getScoreIndexTrend(delta);
}

export function calculateRoleplayIndex(scoresByRecency: number[]): RoleplayIndexResult {
    const result = calculateScoreIndex(scoresByRecency);

    return {
        delta: result.delta,
        score: result.score,
        sessionCount: result.resultCount,
        trend: result.trend,
    };
}

export function calculateRoleplayIndexSeries(
    scoresByRecency: number[],
    pointCount = ROLEPLAY_INDEX_RECENT_SESSION_LIMIT,
) {
    return calculateScoreIndexSeries(scoresByRecency, pointCount);
}
