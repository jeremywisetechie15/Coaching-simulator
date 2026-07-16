import { describe, expect, it } from "vitest";
import { DEFAULT_METHOD_STEP_ICON } from "@/features/methods/domain/method";
import { mapMethodStepRow, type MethodStepRow } from "./method.mapper";

function methodStepRow(icon: string | null): MethodStepRow {
    return {
        icon,
        id: "11111111-1111-4111-8111-111111111111",
        method_id: "22222222-2222-4222-8222-222222222222",
        step_order: 1,
        title: "Conclure",
    };
}

describe("mapMethodStepRow", () => {
    it("preserves a newly supported icon when a method is read after create or update", () => {
        expect(mapMethodStepRow(methodStepRow("trophy"), []).icon).toBe("trophy");
    });

    it("uses the shared safe fallback for historical invalid values", () => {
        expect(mapMethodStepRow(methodStepRow("unknown-icon"), []).icon).toBe(DEFAULT_METHOD_STEP_ICON);
        expect(mapMethodStepRow(methodStepRow(null), []).icon).toBe(DEFAULT_METHOD_STEP_ICON);
    });
});
