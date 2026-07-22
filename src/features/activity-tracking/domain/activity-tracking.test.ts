import { describe, expect, it } from "vitest";
import {
    ACTIVE_DURATION_INACTIVITY_TIMEOUT_MS,
    canAccumulateActiveDuration,
    getAcceptedActiveDurationIncrement,
} from "./activity-tracking";

describe("activity tracking domain", () => {
    it("counts only visible and recently active time", () => {
        expect(canAccumulateActiveDuration({
            isVisible: true,
            lastActivityAtMs: 1_000,
            nowMs: 2_000,
        })).toBe(true);
        expect(canAccumulateActiveDuration({
            isVisible: false,
            lastActivityAtMs: 1_000,
            nowMs: 2_000,
        })).toBe(false);
        expect(canAccumulateActiveDuration({
            isVisible: true,
            lastActivityAtMs: 1_000,
            nowMs: 1_000 + ACTIVE_DURATION_INACTIVITY_TIMEOUT_MS + 1,
        })).toBe(false);
    });

    it("caps every heartbeat to sixty seconds", () => {
        expect(getAcceptedActiveDurationIncrement({
            lastActivityAt: null,
            now: new Date("2026-07-22T10:00:00.000Z"),
            requestedSeconds: 120,
        })).toBe(60);
    });

    it("never accepts more time than elapsed since the preceding heartbeat", () => {
        expect(getAcceptedActiveDurationIncrement({
            lastActivityAt: "2026-07-22T09:59:55.000Z",
            now: new Date("2026-07-22T10:00:00.000Z"),
            requestedSeconds: 30,
        })).toBe(5);
    });
});
