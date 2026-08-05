import { describe, expect, it } from "vitest";
import { updateProfileDto } from "./update-profile.dto";

const validProfile = {
    bio: "Manager commercial",
    firstName: "Paul",
    lastName: "Laverdure",
};

describe("update profile dto", () => {
    it("accepts a catalog activity sector", () => {
        const result = updateProfileDto.safeParse({
            ...validProfile,
            activitySectorCode: "CST",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.activitySectorCode).toBe("CST");
        }
    });

    it("accepts null and omission for backward compatibility", () => {
        expect(updateProfileDto.safeParse({
            ...validProfile,
            activitySectorCode: null,
        }).success).toBe(true);
        expect(updateProfileDto.safeParse(validProfile).success).toBe(true);
    });

    it("rejects a code outside the catalog", () => {
        const result = updateProfileDto.safeParse({
            ...validProfile,
            activitySectorCode: "UNKNOWN",
        });

        expect(result.success).toBe(false);
    });
});
