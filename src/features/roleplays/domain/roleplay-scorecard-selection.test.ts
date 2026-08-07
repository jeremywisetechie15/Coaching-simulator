import { describe, expect, it } from "vitest";
import { isRoleplayScorecardAssignableForMethod } from "./roleplay-scorecard-selection";

describe("roleplay scorecard selection policy", () => {
    it("allows only a selectable scorecard of the selected method", () => {
        expect(isRoleplayScorecardAssignableForMethod({
            id: "scorecard-1",
            methodId: "method-1",
        }, "method-1")).toBe(true);
        expect(isRoleplayScorecardAssignableForMethod({
            id: "scorecard-1",
            methodId: "method-2",
        }, "method-1")).toBe(false);
        expect(isRoleplayScorecardAssignableForMethod({
            id: "scorecard-1",
            isSelectable: false,
            methodId: "method-1",
        }, "method-1")).toBe(false);
    });
});
