import { describe, expect, it } from "vitest";
import {
    PERSONA_AGE_RANGE,
    PERSONA_COMPANY_SIZE,
    filterPersonasByLibraryFilters,
    isPersonaAgeRange,
    isPersonaCompanySize,
    type PersonaLibraryFilterCandidate,
    type PersonaLibraryFilters,
} from "./persona-library-filters";

const personas: Array<PersonaLibraryFilterCandidate & { id: string }> = [
    {
        activitySectorCode: "TIC",
        ageYears: 42,
        company: "TechCorp",
        discProfile: "Stable",
        employeeCountValue: 50,
        id: "sophie",
        name: "Sophie Martin",
        pcsGroupCode: "3",
        role: "Directrice commerciale",
        sexCode: "female",
    },
    {
        activitySectorCode: "BTP",
        ageYears: 24,
        company: "Bâtir SARL",
        discProfile: "Dominant",
        employeeCountValue: 8,
        id: "marc",
        name: "Marc Leroy",
        pcsGroupCode: "5",
        role: "Commercial",
        sexCode: "male",
    },
    {
        activitySectorCode: "SAN",
        ageYears: 67,
        company: "Santé France",
        discProfile: "Consciencieux",
        employeeCountValue: 5_000,
        id: "nadia",
        name: "Nadia Pérez",
        pcsGroupCode: "7",
        role: "Consultante",
        sexCode: "female",
    },
    {
        activitySectorCode: null,
        ageYears: null,
        company: "",
        discProfile: "Inconnu",
        employeeCountValue: null,
        id: "legacy",
        name: "Persona historique",
        pcsGroupCode: null,
        role: "",
        sexCode: null,
    },
];

const emptyFilters: PersonaLibraryFilters = {
    activitySectorCode: "",
    ageRange: "",
    companySize: "",
    discProfile: "",
    pcsGroupCode: "",
    query: "",
    sexCode: "",
};

describe("persona library filters", () => {
    it("combines sex, age, CSP, sector, company size and DISC", () => {
        const result = filterPersonasByLibraryFilters(personas, {
            activitySectorCode: "TIC",
            ageRange: PERSONA_AGE_RANGE.from35To44,
            companySize: PERSONA_COMPANY_SIZE.pme,
            discProfile: "Stable",
            pcsGroupCode: "3",
            query: "",
            sexCode: "female",
        });

        expect(result.map(({ id }) => id)).toEqual(["sophie"]);
    });

    it("uses exhaustive age and company-size boundaries without classifying missing values", () => {
        expect(filterPersonasByLibraryFilters(personas, {
            ...emptyFilters,
            ageRange: PERSONA_AGE_RANGE.under25,
            companySize: PERSONA_COMPANY_SIZE.tpe,
        }).map(({ id }) => id)).toEqual(["marc"]);

        expect(filterPersonasByLibraryFilters(personas, {
            ...emptyFilters,
            ageRange: PERSONA_AGE_RANGE.from65,
            companySize: PERSONA_COMPANY_SIZE.large,
        }).map(({ id }) => id)).toEqual(["nadia"]);
    });

    it("searches names and SSOT labels without being sensitive to accents", () => {
        expect(filterPersonasByLibraryFilters(personas, {
            ...emptyFilters,
            query: "sante",
        }).map(({ id }) => id)).toEqual(["nadia"]);
        expect(filterPersonasByLibraryFilters(personas, {
            ...emptyFilters,
            query: "perez",
        }).map(({ id }) => id)).toEqual(["nadia"]);
    });

    it("validates only declared URL filter values", () => {
        expect(isPersonaAgeRange("35_44")).toBe(true);
        expect(isPersonaAgeRange("35_45")).toBe(false);
        expect(isPersonaCompanySize("pme")).toBe(true);
        expect(isPersonaCompanySize("startup")).toBe(false);
    });
});
