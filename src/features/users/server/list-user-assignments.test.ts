import { describe, expect, it } from "vitest";
import {
    calculateAssignedQuizProgress,
    calculateAssignedRoleplayIndex,
} from "./list-user-assignments";

describe("calculateAssignedRoleplayIndex", () => {
    it("uses the three best scores from the six most recent scored sessions", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-01T10:00:00.000Z", score: 100 },
            { completedAt: "2026-01-07T10:00:00.000Z", score: 10 },
            { completedAt: "2026-01-03T10:00:00.000Z", score: 60 },
            { completedAt: "2026-01-05T10:00:00.000Z", score: 80 },
            { completedAt: "2026-01-02T10:00:00.000Z", score: 50 },
            { completedAt: "2026-01-06T10:00:00.000Z", score: 90 },
            { completedAt: "2026-01-04T10:00:00.000Z", score: 70 },
        ])).toBe(80);
    });

    it("keeps the index pending when fewer than three scored sessions exist", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-02T10:00:00.000Z", score: 70 },
            { completedAt: "2026-01-01T10:00:00.000Z", score: 50 },
        ])).toBeNull();
    });

    it("returns the index from three scored sessions", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-03T10:00:00.000Z", score: 70 },
            { completedAt: "2026-01-02T10:00:00.000Z", score: 60 },
            { completedAt: "2026-01-01T10:00:00.000Z", score: 50 },
        ])).toBe(60);
    });

    it("returns null when no session has a score", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-01T10:00:00.000Z", score: null },
        ])).toBeNull();
    });
});

describe("calculateAssignedQuizProgress", () => {
    it("counts completed attempts and keeps the best completed score", () => {
        expect(calculateAssignedQuizProgress([
            { scorePercent: 55, status: "completed" },
            { scorePercent: 85, status: "completed" },
            { scorePercent: null, status: "in_progress" },
        ])).toEqual({
            attempts: 2,
            score: 85,
            status: "completed",
        });
    });

    it("keeps an unfinished first attempt in progress without consuming an attempt", () => {
        expect(calculateAssignedQuizProgress([
            { scorePercent: null, status: "in_progress" },
        ])).toEqual({
            attempts: 0,
            score: null,
            status: "in_progress",
        });
    });
});
