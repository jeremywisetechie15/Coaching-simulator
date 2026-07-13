import { describe, expect, it } from "vitest";
import { calculateAssignedRoleplayIndex } from "./list-user-assignments";

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

    it("averages every available score when fewer than three sessions exist", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-02T10:00:00.000Z", score: 70 },
            { completedAt: "2026-01-01T10:00:00.000Z", score: 50 },
        ])).toBe(60);
    });

    it("returns null when no session has a score", () => {
        expect(calculateAssignedRoleplayIndex([
            { completedAt: "2026-01-01T10:00:00.000Z", score: null },
        ])).toBeNull();
    });
});
