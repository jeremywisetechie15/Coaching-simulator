import { describe, expect, it } from "vitest";
import { savePersonaDto } from "./save-persona.dto";

const validPersona = {
    age: "42",
    annualRevenue: "5 M€",
    avatarUrl: "/personas/avatar.png",
    childrenCount: "2",
    company: "TechCorp",
    companyDescription: "Entreprise technologique B2B.",
    diploma: "Master commerce",
    discProfile: "Stable",
    employeeCount: "50",
    industry: "Technologie",
    maritalStatus: "Marié",
    name: "Sophie Martin",
    nationality: "Française",
    netIncomeBeforeTax: "3 200 € / mois",
    residenceCountry: "France",
    role: "Directrice commerciale",
    systemInstructions: "Répondre comme une persona exigeante.",
    voiceId: "alloy",
};

describe("savePersonaDto", () => {
    it("accepts professional, personal and DISC profile fields", () => {
        const parsed = savePersonaDto.parse(validPersona);

        expect(parsed).toMatchObject({
            age: "42",
            childrenCount: "2",
            companyDescription: "Entreprise technologique B2B.",
            discProfile: "Stable",
            employeeCount: "50",
            industry: "Technologie",
            netIncomeBeforeTax: "3 200 € / mois",
        });
    });

    it("rejects unknown industry and non-numeric count fields", () => {
        expect(() =>
            savePersonaDto.parse({
                ...validPersona,
                childrenCount: "deux",
                industry: "Secteur inconnu",
            }),
        ).toThrow();
    });

    it("rejects age values above the supported persona range", () => {
        expect(() =>
            savePersonaDto.parse({
                ...validPersona,
                age: "131",
            }),
        ).toThrow("L'âge doit être un nombre entier positif inférieur ou égal à 130.");
    });

    it("keeps net income optional for existing clients and personas", () => {
        const legacyPayload: Partial<typeof validPersona> = { ...validPersona };
        delete legacyPayload.netIncomeBeforeTax;
        const parsed = savePersonaDto.parse(legacyPayload);

        expect(parsed.netIncomeBeforeTax).toBe("");
    });
});
