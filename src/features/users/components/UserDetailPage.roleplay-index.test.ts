import { describe, expect, it } from "vitest";
import { getAssignedRoleplayIndexEmptyLabel } from "./UserDetailPage";

describe("UserDetailPage roleplay index", () => {
    it("shows N/A without an eligible session", () => {
        expect(getAssignedRoleplayIndexEmptyLabel(0)).toBe("N/A");
    });

    it("shows En cours while the index does not have three eligible sessions", () => {
        expect(getAssignedRoleplayIndexEmptyLabel(1)).toBe("En cours");
        expect(getAssignedRoleplayIndexEmptyLabel(2)).toBe("En cours");
    });
});
