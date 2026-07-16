import { describe, expect, it } from "vitest";
import {
    calculateScorecardGlobalScorePercent,
    calculateScorecardStepScorePercent,
    distributeScorecardStepWeights,
    getScorecardStepWeightTotal,
    isCompleteScorecardStepWeighting,
} from "./scorecard-weighting";

describe("scorecard weighting", () => {
    it("distributes 100 percent without losing decimal precision", () => {
        const weights = distributeScorecardStepWeights(3);

        expect(weights).toEqual([33.34, 33.33, 33.33]);
        expect(getScorecardStepWeightTotal(weights)).toBe(100);
        expect(isCompleteScorecardStepWeighting(weights)).toBe(true);
    });

    it("requires positive weights totaling 100 percent", () => {
        expect(isCompleteScorecardStepWeighting([50, 50])).toBe(true);
        expect(isCompleteScorecardStepWeighting([0, 100])).toBe(false);
        expect(isCompleteScorecardStepWeighting([40, 50])).toBe(false);
    });

    it("gives every criterion the same influence inside a step", () => {
        expect(calculateScorecardStepScorePercent([100, 25])).toBe(62.5);
    });

    it("applies explicit step weights to the global score", () => {
        expect(calculateScorecardGlobalScorePercent([
            { scorePercent: 50, weightPercent: 40 },
            { scorePercent: 100, weightPercent: 60 },
        ])).toBe(80);
    });

    it("rejects an incomplete weighting before calculating a score", () => {
        expect(() => calculateScorecardGlobalScorePercent([
            { scorePercent: 50, weightPercent: 40 },
        ])).toThrow("La pondération des étapes de la scorecard doit totaliser 100%.");
    });
});
