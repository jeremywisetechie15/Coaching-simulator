import { describe, expect, it } from "vitest";
import {
    calculateRoleplayIndex,
    calculateRoleplayIndexSeries,
    ROLEPLAY_INDEX_BEST_SESSION_COUNT,
    ROLEPLAY_INDEX_RECENT_SESSION_LIMIT,
    selectRoleplayIndexScorePositions,
} from "./roleplay-index";

describe("roleplay index", () => {
    it("averages the best 3 scores from the latest 6 simulations", () => {
        expect(ROLEPLAY_INDEX_BEST_SESSION_COUNT).toBe(3);
        expect(ROLEPLAY_INDEX_RECENT_SESSION_LIMIT).toBe(6);
        expect(calculateRoleplayIndex([100, 40, 90, 60, 70, 50, 80])).toEqual({
            delta: 7,
            score: 87,
            sessionCount: 6,
            trend: "up",
        });
    });

    it("uses all available scores until three simulations exist", () => {
        expect(calculateRoleplayIndex([70, 50])).toEqual({
            delta: 10,
            score: 60,
            sessionCount: 2,
            trend: "up",
        });
        expect(calculateRoleplayIndex([70])).toEqual({
            delta: null,
            score: 70,
            sessionCount: 1,
            trend: "unavailable",
        });
    });

    it("returns an empty index without evaluated simulations", () => {
        expect(calculateRoleplayIndex([])).toEqual({
            delta: null,
            score: null,
            sessionCount: 0,
            trend: "unavailable",
        });
    });

    it("detects decreasing and stable windows", () => {
        expect(calculateRoleplayIndex([10, 90, 80, 70, 60, 50, 100])).toMatchObject({
            delta: -10,
            score: 80,
            trend: "down",
        });
        expect(calculateRoleplayIndex([50, 90, 80, 70, 60, 40, 30])).toMatchObject({
            delta: 0,
            score: 80,
            trend: "stable",
        });
    });

    it("selects the three best positions and prefers the most recent score on ties", () => {
        expect(selectRoleplayIndexScorePositions([70, 90, 90, 50, 80, 40])).toEqual([1, 2, 4]);
    });

    it("builds the rolling index series for the six displayed simulations", () => {
        expect(calculateRoleplayIndexSeries([100, 40, 90, 60, 70, 50, 80])).toEqual([87, 80, 80, 70, 67, 65]);
    });

    it("keeps the latest curve point equal to the current index", () => {
        const scores = [32, 13, 41, 62];
        const currentIndex = calculateRoleplayIndex(scores);
        const series = calculateRoleplayIndexSeries(scores);

        expect(currentIndex.score).toBe(45);
        expect(series).toEqual([45, 39, 52, 62]);
        expect(series[0]).toBe(currentIndex.score);
    });
});
