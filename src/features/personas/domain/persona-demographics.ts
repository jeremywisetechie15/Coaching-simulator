export const PERSONA_SEX_CODE = {
    female: "female",
    male: "male",
} as const;

export const PERSONA_SEX_CODES = [
    PERSONA_SEX_CODE.female,
    PERSONA_SEX_CODE.male,
] as const;

export type PersonaSexCode = (typeof PERSONA_SEX_CODES)[number];

export const PERSONA_SEXES: ReadonlyArray<{
    code: PersonaSexCode;
    label: string;
}> = [
    { code: PERSONA_SEX_CODE.female, label: "Femme" },
    { code: PERSONA_SEX_CODE.male, label: "Homme" },
];

export const PERSONA_PCS_GROUP_CODES = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

export type PersonaPcsGroupCode = (typeof PERSONA_PCS_GROUP_CODES)[number];

export const PERSONA_PCS_GROUPS: ReadonlyArray<{
    code: PersonaPcsGroupCode;
    label: string;
}> = [
    { code: "1", label: "Agriculteurs exploitants" },
    { code: "2", label: "Artisans, commerçants et chefs d'entreprise" },
    { code: "3", label: "Cadres et professions intellectuelles supérieures" },
    { code: "4", label: "Professions intermédiaires" },
    { code: "5", label: "Employés" },
    { code: "6", label: "Ouvriers" },
    { code: "7", label: "Retraités" },
    { code: "8", label: "Autres personnes sans activité professionnelle" },
];

const personaSexByCode = new Map(PERSONA_SEXES.map((item) => [item.code, item]));
const personaSexByLabel = new Map(PERSONA_SEXES.map((item) => [item.label, item]));
const personaPcsGroupByCode = new Map(PERSONA_PCS_GROUPS.map((item) => [item.code, item]));
const personaPcsGroupByLabel = new Map(PERSONA_PCS_GROUPS.map((item) => [item.label, item]));

export function isPersonaSexCode(value: unknown): value is PersonaSexCode {
    return typeof value === "string" && personaSexByCode.has(value as PersonaSexCode);
}

export function getPersonaSexCode(value: unknown): PersonaSexCode | null {
    return typeof value === "string" ? personaSexByLabel.get(value)?.code ?? null : null;
}

export function getPersonaSexLabel(value: unknown): string | null {
    return typeof value === "string"
        ? personaSexByCode.get(value as PersonaSexCode)?.label ?? null
        : null;
}

export function isPersonaPcsGroupCode(value: unknown): value is PersonaPcsGroupCode {
    return typeof value === "string" && personaPcsGroupByCode.has(value as PersonaPcsGroupCode);
}

export function getPersonaPcsGroupCode(value: unknown): PersonaPcsGroupCode | null {
    return typeof value === "string" ? personaPcsGroupByLabel.get(value)?.code ?? null : null;
}

export function getPersonaPcsGroupLabel(value: unknown): string | null {
    return typeof value === "string"
        ? personaPcsGroupByCode.get(value as PersonaPcsGroupCode)?.label ?? null
        : null;
}
