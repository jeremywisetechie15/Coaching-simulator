import { describe, expect, it } from "vitest";
import { getMethodScopeLabel, METHOD_SCOPE } from "./method";

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
