import { describe, expect, it } from "vitest";
import { mapProfileRowToView, type ProfileRow } from "./profile.mapper";

function profileRow(overrides: Partial<ProfileRow> = {}): ProfileRow {
    return {
        activity_sector_code: null,
        avatar_path: null,
        bio: null,
        email: "paul@example.com",
        first_name: "Paul",
        last_name: "Laverdure",
        name: "Paul Laverdure",
        ...overrides,
    };
}

describe("profile mapper", () => {
    it("maps a valid activity sector code", () => {
        const profile = mapProfileRowToView(
            profileRow({ activity_sector_code: "BFA" }),
            "paul@example.com",
            "user",
        );

        expect(profile.activitySectorCode).toBe("BFA");
    });

    it("keeps legacy or absent activity sectors nullable", () => {
        const missingSector = mapProfileRowToView(
            profileRow(),
            "paul@example.com",
            "user",
        );
        const unknownSector = mapProfileRowToView(
            profileRow({ activity_sector_code: "LEGACY" }),
            "paul@example.com",
            "user",
        );

        expect(missingSector.activitySectorCode).toBeNull();
        expect(unknownSector.activitySectorCode).toBeNull();
    });
});
