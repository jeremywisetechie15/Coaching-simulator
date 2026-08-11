import { describe, expect, it } from "vitest";
import {
    mapPersonaRowToDetail,
    mapPersonaRowToEditorValues,
    mapPersonaRowToListItem,
    toNullableInteger,
    type PersonaRow,
} from "./persona.mapper";

const basePersonaRow: PersonaRow = {
    activity_sector_code: null,
    age: null,
    annual_revenue: null,
    avatar_url: null,
    children_count: null,
    company: null,
    company_description: null,
    created_at: "2026-06-27T10:00:00.000Z",
    diploma: null,
    disc_profile: null,
    employee_count: null,
    id: "11111111-1111-4111-8111-111111111111",
    industry: null,
    marital_status: null,
    name: "Sophie Martin",
    nationality: null,
    net_income_before_tax: null,
    pcs_group_code: null,
    residence_country: null,
    role: null,
    sex_code: null,
    status: "published",
    system_instructions: "Instructions persona",
    updated_at: "2026-06-27T11:00:00.000Z",
    voice_id: "alloy",
};

describe("persona.mapper", () => {
    it("maps legacy nullable persona profile fields to editable defaults", () => {
        const values = mapPersonaRowToEditorValues(basePersonaRow);

        expect(values).toMatchObject({
            age: "",
            childrenCount: "",
            companyDescription: "",
            discProfile: "Stable",
            employeeCount: "",
            activitySectorCode: null,
            name: "Sophie Martin",
            netIncomeBeforeTax: "",
        });
    });

    it("maps persisted numeric profile fields to form strings", () => {
        const values = mapPersonaRowToEditorValues({
            ...basePersonaRow,
            age: 42,
            children_count: 2,
            disc_profile: "Consciencieux",
            employee_count: 50,
            industry: "Conseil",
            net_income_before_tax: "3 200 € / mois",
            pcs_group_code: "3",
            sex_code: "female",
        });

        expect(values).toMatchObject({
            age: "42",
            childrenCount: "2",
            discProfile: "Consciencieux",
            employeeCount: "50",
            activitySectorCode: "CST",
            netIncomeBeforeTax: "3 200 € / mois",
            pcsGroupCode: "3",
            sexCode: "female",
        });
    });

    it("exposes normalized filter fields in list rows", () => {
        const item = mapPersonaRowToListItem({
            ...basePersonaRow,
            activity_sector_code: "TIC",
            age: 42,
            disc_profile: "Stable",
            employee_count: 50,
            pcs_group_code: "3",
            sex_code: "female",
        });

        expect(item).toMatchObject({
            activitySectorCode: "TIC",
            ageYears: 42,
            discProfile: "Stable",
            employeeCountValue: 50,
            pcsGroupCode: "3",
            sexCode: "female",
        });
    });

    it("ignores a legacy industry outside the shared taxonomy", () => {
        const values = mapPersonaRowToEditorValues({ ...basePersonaRow, industry: "Legacy" });

        expect(values.activitySectorCode).toBeNull();
    });

    it("uses the canonical persona voice for missing or unsupported legacy values", () => {
        expect(mapPersonaRowToEditorValues({ ...basePersonaRow, voice_id: null }).voiceId).toBe("alloy");
        expect(mapPersonaRowToEditorValues({ ...basePersonaRow, voice_id: "unsupported" }).voiceId).toBe("alloy");
    });

    it("converts empty form numbers to null for persistence", () => {
        expect(toNullableInteger("")).toBeNull();
        expect(toNullableInteger(" 50 ")).toBe(50);
    });

    it("maps detail metadata without losing nullable profile values", () => {
        const detail = mapPersonaRowToDetail(basePersonaRow);

        expect(detail).toMatchObject({
            createdAt: "2026-06-27T10:00:00.000Z",
            id: basePersonaRow.id,
            name: "Sophie Martin",
            status: "published",
            updatedAt: "2026-06-27T11:00:00.000Z",
            voiceName: "Alloy",
        });
    });
});
