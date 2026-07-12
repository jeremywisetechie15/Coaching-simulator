import { describe, expect, it } from "vitest";
import { mapCoachRowToDetail, mapCoachRowToEditorValues, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

const baseCoachRow: CoachRow = {
    avatar_url: null,
    certifications: null,
    coaching_style: null,
    created_at: "2026-06-27T10:00:00.000Z",
    diploma: null,
    disc_profile: null,
    expertise_domain: null,
    id: "11111111-1111-4111-8111-111111111111",
    name: "Pierre Laurent",
    status: "published",
    system_instructions: "Instructions coach",
    updated_at: "2026-06-27T11:00:00.000Z",
    voice_id: "cedar",
};

describe("coach.mapper", () => {
    it("maps legacy nullable coach profile fields to editable defaults", () => {
        const values = mapCoachRowToEditorValues(baseCoachRow);

        expect(values).toMatchObject({
            backgroundImagePath: "",
            certifications: "",
            coachingStyle: "Optimiste",
            diploma: "",
            discProfile: "Stable",
            expertiseDomain: "",
            name: "Pierre Laurent",
        });
    });

    it("maps persisted coach profile fields to editor values", () => {
        const values = mapCoachRowToEditorValues({
            ...baseCoachRow,
            background_image_path: "coaches/coach-1/background.webp",
            certifications: "ICF",
            coaching_style: "Exigeant",
            diploma: "Master coaching",
            disc_profile: "Consciencieux",
            expertise_domain: "Management",
        });

        expect(values).toMatchObject({
            backgroundImagePath: "coaches/coach-1/background.webp",
            certifications: "ICF",
            coachingStyle: "Exigeant",
            diploma: "Master coaching",
            discProfile: "Consciencieux",
            expertiseDomain: "Management",
        });
    });

    it("maps persisted profile fields to the coach card", () => {
        const item = mapCoachRowToListItem({
            ...baseCoachRow,
            certifications: "ICF",
            coaching_style: "Exigeant",
            diploma: "Master coaching",
            disc_profile: "Consciencieux",
            expertise_domain: "Management",
        });

        expect(item).toMatchObject({
            certifications: "ICF",
            coachingStyle: "Exigeant",
            diploma: "Master coaching",
            discProfile: "Consciencieux",
            expertiseDomain: "Management",
        });
    });

    it("maps detail metadata and voice presentation", () => {
        const detail = mapCoachRowToDetail(baseCoachRow);

        expect(detail).toMatchObject({
            createdAt: "2026-06-27T10:00:00.000Z",
            id: baseCoachRow.id,
            name: "Pierre Laurent",
            status: "published",
            updatedAt: "2026-06-27T11:00:00.000Z",
            voiceName: "Cedar",
        });
    });
});
