export const SCORECARD_STEP_WEIGHT_TOTAL_PERCENT = 100;
export const SCORECARD_STEP_WEIGHT_MIN_PERCENT = 0.01;
export const SCORECARD_STEP_WEIGHT_MAX_DECIMALS = 2;

const SCORECARD_STEP_WEIGHT_SCALE = 10 ** SCORECARD_STEP_WEIGHT_MAX_DECIMALS;
const SCORECARD_STEP_WEIGHT_TOTAL_UNITS =
    SCORECARD_STEP_WEIGHT_TOTAL_PERCENT * SCORECARD_STEP_WEIGHT_SCALE;

export interface ScorecardWeightedStepScore {
    scorePercent: number;
    weightPercent: number;
}

export function roundScorecardPercent(value: number) {
    return Math.round(value * SCORECARD_STEP_WEIGHT_SCALE) / SCORECARD_STEP_WEIGHT_SCALE;
}

export function distributeScorecardStepWeights(stepCount: number) {
    if (stepCount <= 0) return [];

    const baseUnits = Math.floor(SCORECARD_STEP_WEIGHT_TOTAL_UNITS / stepCount);
    const remainder = SCORECARD_STEP_WEIGHT_TOTAL_UNITS % stepCount;

    return Array.from({ length: stepCount }, (_, index) =>
        (baseUnits + (index < remainder ? 1 : 0)) / SCORECARD_STEP_WEIGHT_SCALE,
    );
}

export function getScorecardStepWeightTotal(weights: number[]) {
    return roundScorecardPercent(weights.reduce((total, weight) => total + weight, 0));
}

export function isScorecardStepWeight(value: number) {
    return (
        Number.isFinite(value) &&
        value >= SCORECARD_STEP_WEIGHT_MIN_PERCENT &&
        value <= SCORECARD_STEP_WEIGHT_TOTAL_PERCENT &&
        roundScorecardPercent(value) === value
    );
}

export function isCompleteScorecardStepWeighting(weights: number[]) {
    return (
        weights.length > 0 &&
        weights.every(isScorecardStepWeight) &&
        getScorecardStepWeightTotal(weights) === SCORECARD_STEP_WEIGHT_TOTAL_PERCENT
    );
}

export function calculateScorecardStepScorePercent(criterionScores: number[]) {
    if (criterionScores.length === 0) return 0;

    return roundScorecardPercent(
        criterionScores.reduce((total, score) => total + score, 0) / criterionScores.length,
    );
}

export function calculateScorecardGlobalScorePercent(steps: ScorecardWeightedStepScore[]) {
    if (!isCompleteScorecardStepWeighting(steps.map((step) => step.weightPercent))) {
        throw new Error("La pondération des étapes de la scorecard doit totaliser 100%.");
    }

    return roundScorecardPercent(
        steps.reduce(
            (total, step) =>
                total +
                step.scorePercent *
                    (step.weightPercent / SCORECARD_STEP_WEIGHT_TOTAL_PERCENT),
            0,
        ),
    );
}
