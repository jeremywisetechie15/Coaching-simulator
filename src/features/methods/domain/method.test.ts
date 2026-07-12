import { describe, expect, it } from "vitest";
import {
    calculateMethodMasteryTrend,
    formatMethodMasteryDate,
    getMethodScopeLabel,
    METHOD_MASTERY_TREND,
    METHOD_SCOPE,
    METHOD_STEP_SECTION_LABELS,
} from "./method";

describe("getMethodScopeLabel", () => {
    it("keeps public methods explicit", () => {
        expect(getMethodScopeLabel({ scope: METHOD_SCOPE.public })).toBe("Public");
    });

    it("uses the organization name when an organization-private method has one", () => {
        expect(
            getMethodScopeLabel({
                organizationName: "Maia Coach Demo",
                scope: METHOD_SCOPE.organization,
            }),
        ).toBe("Privé - Maia Coach Demo");
    });

    it("falls back when the organization name is not available", () => {
        expect(getMethodScopeLabel({ organizationName: null, scope: METHOD_SCOPE.organization })).toBe(
            "Privé organisation",
        );
    });
});

describe("formatMethodMasteryDate", () => {
    it("formats the completed attempt date for the UI", () => {
        expect(formatMethodMasteryDate("2026-07-09T15:25:38.909Z")).toBe("09/07/2026");
    });

    it("does not render an invalid or missing date", () => {
        expect(formatMethodMasteryDate(null)).toBeNull();
        expect(formatMethodMasteryDate("invalid")).toBeNull();
    });
});

describe("calculateMethodMasteryTrend", () => {
    it("compares the two latest completed quiz scores", () => {
        expect(calculateMethodMasteryTrend(72, 60)).toEqual({ delta: 12, trend: METHOD_MASTERY_TREND.up });
        expect(calculateMethodMasteryTrend(48, 60)).toEqual({ delta: -12, trend: METHOD_MASTERY_TREND.down });
        expect(calculateMethodMasteryTrend(60, 60)).toEqual({ delta: 0, trend: METHOD_MASTERY_TREND.stable });
    });

    it("marks the first completed quiz as the initial measure", () => {
        expect(calculateMethodMasteryTrend(72, null)).toEqual({
            delta: null,
            trend: METHOD_MASTERY_TREND.initial,
        });
    });
});

describe("METHOD_STEP_SECTION_LABELS", () => {
    it("defines the shared architecture of a method step", () => {
        expect(Object.values(METHOD_STEP_SECTION_LABELS)).toEqual([
            "Objectifs et enjeux",
            "Bonnes pratiques",
            "Écueils à éviter",
            "Posture & Communication",
            "Verbatims préconisés",
        ]);
    });
});
