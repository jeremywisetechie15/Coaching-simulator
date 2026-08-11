import { describe, expect, it } from "vitest";
import {
    createPersonaImportRows,
    preparePersonaImport,
    preparePersonaImportRecord,
    type PersonaImportSourceRecord,
} from "./persona-import";

const sourceRecord: PersonaImportSourceRecord = {
    activitySector: "Informatique, numérique et télécommunications",
    age: "42",
    annualRevenue: "5 M€ / an",
    childrenCount: "2",
    company: "TechCorp",
    companyDescription: "Éditeur B2B.",
    csp: "Cadres et professions intellectuelles supérieures",
    diploma: "Master commerce",
    discProfile: "Stable",
    employeeCount: "50",
    hobbies: "cinéma, natation",
    maritalStatus: "Mariée",
    name: "Sophie Martin",
    nationality: "Française",
    netIncomeBeforeTax: "4 500 € net / mois",
    residenceCountry: "France",
    role: "Directrice commerciale",
    sex: "Femme",
    status: "Brouillon",
    systemInstructions: "Rester calme et factuelle.",
    voice: "Coral",
};

describe("persona import", () => {
    it("maps document labels through the application SSOT", () => {
        expect(preparePersonaImportRecord(sourceRecord)).toMatchObject({
            activitySectorCode: "TIC",
            pcsGroupCode: "3",
            sexCode: "female",
            status: "draft",
            voiceId: "coral",
        });
    });

    it("keeps hobbies in the behavior instructions without adding another database field", () => {
        expect(preparePersonaImportRecord(sourceRecord).systemInstructions).toBe(
            "Rester calme et factuelle.\n\nCentres d’intérêt déclarés : cinéma, natation.",
        );
    });

    it("rejects unknown catalogs and duplicate names before persistence", () => {
        expect(() => preparePersonaImportRecord({ ...sourceRecord, csp: "CSP inconnue" }))
            .toThrow("CSP INSEE inconnu");
        expect(() => preparePersonaImport([sourceRecord, { ...sourceRecord }]))
            .toThrow("Nom de persona dupliqué");
    });

    it("creates global draft rows with no owner", () => {
        expect(createPersonaImportRows([sourceRecord], {
            createId: () => "persona-1",
            now: "2026-08-11T17:00:00.000Z",
        })[0]).toMatchObject({
            activity_sector_code: "TIC",
            created_by: null,
            id: "persona-1",
            pcs_group_code: "3",
            sex_code: "female",
            status: "draft",
        });
    });

    it("stores source placeholders as nullable database values", () => {
        const row = createPersonaImportRows([{
            ...sourceRecord,
            annualRevenue: "Non applicable",
            employeeCount: "Non applicable",
        }], {
            createId: () => "persona-1",
            now: "2026-08-11T17:00:00.000Z",
        })[0];

        expect(row.annual_revenue).toBeNull();
        expect(row.employee_count).toBeNull();
    });
});
