import { describe, expect, it } from "vitest";
import {
    SCORE_INDEX_BEST_RESULT_COUNT,
    SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT,
    SCORE_INDEX_RECENT_RESULT_LIMIT,
    calculateScoreIndex,
    calculateScoreIndexSeries,
    getScoreIndexDisplayState,
    selectScoreIndexPositions,
} from "./score-index";

describe("score index", () => {
    it("averages the best 3 scores from the latest 6 results", () => {
        expect(SCORE_INDEX_BEST_RESULT_COUNT).toBe(3);
        expect(SCORE_INDEX_RECENT_RESULT_LIMIT).toBe(6);
        expect(calculateScoreIndex([100, 40, 90, 60, 70, 50, 80])).toEqual({
            delta: 7,
            resultCount: 6,
            score: 87,
            trend: "up",
        });
    });

    it("only exposes the score after three results", () => {
        expect(SCORE_INDEX_MINIMUM_VISIBLE_RESULT_COUNT).toBe(3);
        expect(getScoreIndexDisplayState(0)).toBe("empty");
        expect(getScoreIndexDisplayState(2)).toBe("pending");
        expect(getScoreIndexDisplayState(3)).toBe("available");
    });

    it("selects the best positions and builds the rolling series", () => {
        expect(selectScoreIndexPositions([70, 90, 90, 50, 80, 40])).toEqual([1, 2, 4]);
        expect(calculateScoreIndexSeries([100, 40, 90, 60, 70, 50, 80])).toEqual([
            87,
            80,
            80,
            70,
            67,
            65,
        ]);
    });
});
