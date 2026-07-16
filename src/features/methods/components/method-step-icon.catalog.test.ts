import { describe, expect, it } from "vitest";
import {
    METHOD_STEP_ICON_LABELS,
    METHOD_STEP_ICONS,
} from "@/features/methods/domain/method";
import {
    getMethodStepIconPresentation,
    METHOD_STEP_ICON_OPTIONS,
} from "./method-step-icon.catalog";

describe("method-step icon presentation catalogue", () => {
    it("derives every dropdown option from the domain catalogue", () => {
        expect(METHOD_STEP_ICON_OPTIONS.map((option) => option.value)).toEqual(METHOD_STEP_ICONS);
        expect(new Set(METHOD_STEP_ICON_OPTIONS.map((option) => option.value)).size).toBe(METHOD_STEP_ICONS.length);

        for (const option of METHOD_STEP_ICON_OPTIONS) {
            expect(option.label).toBe(METHOD_STEP_ICON_LABELS[option.value]);
            expect(option.icon).toBeTruthy();
        }
    });

    it("provides a complete renderer configuration for every accepted value", () => {
        for (const value of METHOD_STEP_ICONS) {
            const presentation = getMethodStepIconPresentation(value);

            expect(presentation.icon).toBeTruthy();
            expect(presentation.bg).toMatch(/^#[\dA-F]{6}$/i);
            expect(presentation.color).toMatch(/^#[\dA-F]{6}$/i);
        }
    });
});
