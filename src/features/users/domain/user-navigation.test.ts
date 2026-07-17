import { describe, expect, it } from "vitest";
import { getUserDetailHref, withoutUserDetailMode } from "./user-navigation";

describe("user detail navigation", () => {
    it("builds the view and edit destinations used by user tables", () => {
        expect(getUserDetailHref("user-1")).toBe("/users/user-1");
        expect(getUserDetailHref("user-1", "edit")).toBe("/users/user-1?mode=edit");
    });

    it("removes only edit mode and preserves the contextual return destination", () => {
        expect(
            withoutUserDetailMode(
                "/users/user-1?mode=edit&returnTo=%2Forganizations%2Forganization-1%3Ftab%3Dusers",
            ),
        ).toBe("/users/user-1?returnTo=%2Forganizations%2Forganization-1%3Ftab%3Dusers");
    });
});
