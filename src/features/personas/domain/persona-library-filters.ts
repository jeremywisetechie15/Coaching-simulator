import { getActivitySectorLabel, type ActivitySectorCode } from "@/features/content/domain";
import {
    getPersonaPcsGroupLabel,
    getPersonaSexLabel,
    type PersonaPcsGroupCode,
    type PersonaSexCode,
} from "./persona-demographics";
import type { PersonaDiscProfile } from "./persona-profile";

export const PERSONA_AGE_RANGE = {
    under25: "under_25",
    from25To34: "25_34",
    from35To44: "35_44",
    from45To54: "45_54",
    from55To64: "55_64",
    from65: "65_plus",
} as const;

export type PersonaAgeRange = (typeof PERSONA_AGE_RANGE)[keyof typeof PERSONA_AGE_RANGE];

export const PERSONA_AGE_RANGES: ReadonlyArray<{
    label: string;
    max: number | null;
    min: number;
    value: PersonaAgeRange;
}> = [
    { label: "Moins de 25 ans", max: 24, min: 0, value: PERSONA_AGE_RANGE.under25 },
    { label: "25 à 34 ans", max: 34, min: 25, value: PERSONA_AGE_RANGE.from25To34 },
    { label: "35 à 44 ans", max: 44, min: 35, value: PERSONA_AGE_RANGE.from35To44 },
    { label: "45 à 54 ans", max: 54, min: 45, value: PERSONA_AGE_RANGE.from45To54 },
    { label: "55 à 64 ans", max: 64, min: 55, value: PERSONA_AGE_RANGE.from55To64 },
    { label: "65 ans et plus", max: null, min: 65, value: PERSONA_AGE_RANGE.from65 },
];

export const PERSONA_COMPANY_SIZE = {
    tpe: "tpe",
    pme: "pme",
    eti: "eti",
    large: "large_company",
} as const;

export type PersonaCompanySize = (typeof PERSONA_COMPANY_SIZE)[keyof typeof PERSONA_COMPANY_SIZE];

export const PERSONA_COMPANY_SIZES: ReadonlyArray<{
    label: string;
    max: number | null;
    min: number;
    value: PersonaCompanySize;
}> = [
    { label: "TPE · 0 à 9 salariés", max: 9, min: 0, value: PERSONA_COMPANY_SIZE.tpe },
    { label: "PME · 10 à 249 salariés", max: 249, min: 10, value: PERSONA_COMPANY_SIZE.pme },
    { label: "ETI · 250 à 4 999 salariés", max: 4_999, min: 250, value: PERSONA_COMPANY_SIZE.eti },
    { label: "Grande entreprise · 5 000+", max: null, min: 5_000, value: PERSONA_COMPANY_SIZE.large },
];

export interface PersonaLibraryFilterCandidate {
    activitySectorCode: ActivitySectorCode | null;
    ageYears: number | null;
    company: string;
    discProfile: PersonaDiscProfile;
    employeeCountValue: number | null;
    name: string;
    pcsGroupCode: PersonaPcsGroupCode | null;
    role: string;
    sexCode: PersonaSexCode | null;
}

export interface PersonaLibraryFilters {
    activitySectorCode: ActivitySectorCode | "";
    ageRange: PersonaAgeRange | "";
    companySize: PersonaCompanySize | "";
    discProfile: PersonaDiscProfile | "";
    pcsGroupCode: PersonaPcsGroupCode | "";
    query: string;
    sexCode: PersonaSexCode | "";
}

function normalizeSearchValue(value: string) {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim()
        .toLocaleLowerCase("fr");
}

function matchesNumericRange(
    value: number | null,
    range: { max: number | null; min: number } | undefined,
) {
    if (value === null || !range) return false;
    return value >= range.min && (range.max === null || value <= range.max);
}

export function isPersonaAgeRange(value: unknown): value is PersonaAgeRange {
    return typeof value === "string" && PERSONA_AGE_RANGES.some((range) => range.value === value);
}

export function isPersonaCompanySize(value: unknown): value is PersonaCompanySize {
    return typeof value === "string" && PERSONA_COMPANY_SIZES.some((size) => size.value === value);
}

export function filterPersonasByLibraryFilters<T extends PersonaLibraryFilterCandidate>(
    personas: T[],
    filters: PersonaLibraryFilters,
) {
    const query = normalizeSearchValue(filters.query);
    const ageRange = PERSONA_AGE_RANGES.find(({ value }) => value === filters.ageRange);
    const companySize = PERSONA_COMPANY_SIZES.find(({ value }) => value === filters.companySize);

    return personas.filter((persona) => {
        const searchableValues = [
            persona.name,
            persona.role,
            persona.company,
            persona.discProfile,
            getActivitySectorLabel(persona.activitySectorCode) ?? "",
            getPersonaPcsGroupLabel(persona.pcsGroupCode) ?? "",
            getPersonaSexLabel(persona.sexCode) ?? "",
        ];

        return (
            (!query || searchableValues.some((value) => normalizeSearchValue(value).includes(query)))
            && (!filters.sexCode || persona.sexCode === filters.sexCode)
            && (!filters.ageRange || matchesNumericRange(persona.ageYears, ageRange))
            && (!filters.pcsGroupCode || persona.pcsGroupCode === filters.pcsGroupCode)
            && (!filters.activitySectorCode || persona.activitySectorCode === filters.activitySectorCode)
            && (!filters.companySize || matchesNumericRange(persona.employeeCountValue, companySize))
            && (!filters.discProfile || persona.discProfile === filters.discProfile)
        );
    });
}
