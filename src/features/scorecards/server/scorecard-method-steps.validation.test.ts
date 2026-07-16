import { describe, expect, it } from "vitest";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { assertMethodStepsBelongToMethod } from "./scorecard-method-steps.validation";

function createInput(methodStepId: string) {
    return {
        methodId: "method-1",
        steps: [{ methodStepId }],
    } as SaveScorecardDto;
}

function createSupabase(methodStepIds: string[]) {
    const query = {
        eq: () => query,
        in: (_column: string, requestedIds: string[]) => Promise.resolve({
            data: methodStepIds.filter((id) => requestedIds.includes(id)).map((id) => ({ id })),
            error: null,
        }),
        select: () => query,
    };

    return { from: () => query };
}

describe("scorecard method-step validation", () => {
    it("accepts steps belonging to the selected method", async () => {
        await expect(assertMethodStepsBelongToMethod(
            createSupabase(["step-1"]) as never,
            createInput("step-1"),
        )).resolves.toBeUndefined();
    });

    it("rejects a foreign method step before persistence", async () => {
        await expect(assertMethodStepsBelongToMethod(
            createSupabase([]) as never,
            createInput("foreign-step"),
        )).rejects.toMatchObject({
            code: "SCORECARD_METHOD_STEP_MISMATCH",
            status: 400,
        });
    });
});
