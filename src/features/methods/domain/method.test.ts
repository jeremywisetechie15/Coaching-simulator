import { describe, expect, it } from "vitest";
import {
    calculateMethodMasteryTrend,
    DEFAULT_METHOD_STEP_ICON,
    formatMethodMasteryDate,
    getMethodMasteryLabel,
    getMethodSelectionLabel,
    getMethodScopeLabel,
    isMethodStepIcon,
    METHOD_MASTERY_TREND,
    METHOD_SCOPE,
    METHOD_STEP_ICON_LABELS,
    METHOD_STEP_ICONS,
    METHOD_STEP_SECTION_LABELS,
    normalizeMethodStepIcon,
    toMethodSelectOption,
} from "./method";

describe("method selection labels", () => {
    it("uses the canonical method name in every selector", () => {
        const method = { id: "method-1", name: "Méthode DAGO" };

        expect(getMethodSelectionLabel(method)).toBe("Méthode DAGO");
        expect(toMethodSelectOption(method)).toEqual({
            label: "Méthode DAGO",
            value: "method-1",
        });
    });
});

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

describe("getMethodMasteryLabel", () => {
    it("distinguishes a missing quiz from an untested associated quiz", () => {
        expect(getMethodMasteryLabel(false, null)).toBe("Aucun quiz associé");
        expect(getMethodMasteryLabel(true, null)).toBe("Non testée");
        expect(getMethodMasteryLabel(true, { scorePercent: 71.6 })).toBe("72%");
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

describe("method-step icon catalogue", () => {
    it("exposes one stable label for each supported icon", () => {
        expect(METHOD_STEP_ICONS).toHaveLength(28);
        expect(new Set(METHOD_STEP_ICONS).size).toBe(METHOD_STEP_ICONS.length);
        expect(METHOD_STEP_ICONS).toEqual(Object.keys(METHOD_STEP_ICON_LABELS));
        expect(METHOD_STEP_ICONS).toEqual(
            expect.arrayContaining(["ear", "handshake", "target", "plan", "briefcase", "trophy", "zap"]),
        );

        for (const icon of METHOD_STEP_ICONS) {
            expect(METHOD_STEP_ICON_LABELS[icon].trim()).not.toBe("");
            expect(isMethodStepIcon(icon)).toBe(true);
        }
    });

    it("keeps a single safe fallback for missing or legacy values", () => {
        expect(normalizeMethodStepIcon("trophy")).toBe("trophy");
        expect(normalizeMethodStepIcon("unknown-icon")).toBe(DEFAULT_METHOD_STEP_ICON);
        expect(normalizeMethodStepIcon(null)).toBe(DEFAULT_METHOD_STEP_ICON);
    });
});
