import { describe, expect, it } from "vitest";
import { resolveUserAssignmentDate } from "./user-assignment-date";

describe("resolveUserAssignmentDate", () => {
    const userCreatedAt = "2026-07-17T08:34:40.489Z";

    it("keeps the real date of an explicit or derived assignment", () => {
        expect(resolveUserAssignmentDate("2026-07-18T10:00:00.000Z", userCreatedAt)).toBe(
            "2026-07-18T10:00:00.000Z",
        );
    });

    it("uses the user account creation date for inherited content", () => {
        expect(resolveUserAssignmentDate(null, userCreatedAt)).toBe(userCreatedAt);
    });

    it("does not invent a date when neither source exists", () => {
        expect(resolveUserAssignmentDate(null, null)).toBeNull();
    });
});
