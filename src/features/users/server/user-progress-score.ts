import { normalizeAssignmentScore } from "./user-assignment-visibility";

export interface WeightedProgressScoreInput {
    pointsAwarded: number | string | null | undefined;
    pointsMax: number | string | null | undefined;
    scorePercent: number | string | null | undefined;
}

function toNumber(value: number | string | null | undefined) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function roundScore(value: number) {
    return Math.round(Math.max(0, Math.min(100, value)));
}

export function getWeightedProgressScore(rows: WeightedProgressScoreInput[]) {
    if (rows.length === 0) return null;

    const pointsMax = rows.reduce((total, row) => total + Math.max(0, toNumber(row.pointsMax)), 0);

    if (pointsMax > 0) {
        const pointsAwarded = rows.reduce((total, row) => total + Math.max(0, toNumber(row.pointsAwarded)), 0);
        return roundScore((pointsAwarded / pointsMax) * 100);
    }

    const scores = rows
        .map((row) => normalizeAssignmentScore(row.scorePercent))
        .filter((score): score is number => score !== null);

    if (scores.length === 0) return null;

    return roundScore(scores.reduce((total, score) => total + score, 0) / scores.length);
}
