import { describe, expect, it } from "vitest";
import { toProfileFormValues } from "./profile";

describe("profile domain", () => {
    it("does not expose a password placeholder in profile values", () => {
        const values = toProfileFormValues({
            avatarPath: null,
            avatarUrl: null,
            bio: "",
            email: "paul@example.com",
            firstName: "Paul",
            lastName: "Martin",
            platformRole: "user",
        });

        expect(values).not.toHaveProperty("password");
        expect(values.email).toBe("paul@example.com");
    });
});
