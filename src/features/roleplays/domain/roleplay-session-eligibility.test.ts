import { describe, expect, it } from "vitest";
import {
    getRoleplaySessionEvaluationDecision,
    isRoleplaySessionEligibleForEvaluation,
    MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
} from "./roleplay-session-eligibility";

describe("roleplay session eligibility", () => {
    it("requires a completed duration of at least 30 seconds", () => {
        expect(MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS).toBe(30);
        expect(isRoleplaySessionEligibleForEvaluation(29)).toBe(false);
        expect(isRoleplaySessionEligibleForEvaluation(30)).toBe(true);
        expect(isRoleplaySessionEligibleForEvaluation(31)).toBe(true);
    });

    it("rejects missing or invalid durations", () => {
        expect(isRoleplaySessionEligibleForEvaluation(null)).toBe(false);
        expect(isRoleplaySessionEligibleForEvaluation(undefined)).toBe(false);
        expect(isRoleplaySessionEligibleForEvaluation(Number.NaN)).toBe(false);
        expect(isRoleplaySessionEligibleForEvaluation(Number.POSITIVE_INFINITY)).toBe(false);
    });

    it("returns the shared server decision and skip reason", () => {
        expect(getRoleplaySessionEvaluationDecision(29)).toEqual({
            eligible: false,
            minimumDurationSeconds: 30,
            skipReason: "duration_below_minimum",
        });
        expect(getRoleplaySessionEvaluationDecision(30)).toEqual({
            eligible: true,
            minimumDurationSeconds: 30,
            skipReason: null,
        });
    });
});
