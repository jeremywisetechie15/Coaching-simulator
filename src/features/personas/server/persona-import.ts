import { randomUUID } from "node:crypto";
import { CONTENT_STATUS, getActivitySectorCode } from "@/features/content/domain";
import {
    getPersonaPcsGroupCode,
    getPersonaSexCode,
} from "@/features/personas/domain/persona-demographics";
import { savePersonaDto, type SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { createPersonaInsert } from "./persona.persistence";

export interface PersonaImportSourceRecord {
    activitySector: string;
    age: string;
    annualRevenue: string;
    childrenCount: string;
    company: string;
    companyDescription: string;
    csp: string;
    diploma: string;
    discProfile: string;
    employeeCount: string;
    hobbies: string;
    maritalStatus: string;
    name: string;
    nationality: string;
    netIncomeBeforeTax: string;
    residenceCountry: string;
    role: string;
    sex: string;
    status: string;
    systemInstructions: string;
    voice: string;
}

function getImportErrorPrefix(record: PersonaImportSourceRecord) {
    return record.name.trim() || "Persona sans nom";
}

function requireMappedValue<T>(
    value: T | null,
    sourceValue: string,
    fieldLabel: string,
    record: PersonaImportSourceRecord,
): T {
    if (value !== null) return value;
    throw new Error(`${getImportErrorPrefix(record)} : ${fieldLabel} inconnu « ${sourceValue} »`);
}

function buildSystemInstructions(record: PersonaImportSourceRecord) {
    const instructions = record.systemInstructions.trim();
    const hobbies = record.hobbies.trim();

    return hobbies
        ? `${instructions}\n\nCentres d’intérêt déclarés : ${hobbies}.`
        : instructions;
}

function normalizeOptionalSourceValue(value: string) {
    const normalized = value.trim();
    return normalized === "Non applicable" || normalized === "Non renseigné" ? "" : normalized;
}

export function preparePersonaImportRecord(record: PersonaImportSourceRecord): SavePersonaDto {
    if (record.status.trim() !== "Brouillon") {
        throw new Error(`${getImportErrorPrefix(record)} : statut d’import non autorisé « ${record.status} »`);
    }

    const result = savePersonaDto.safeParse({
        activitySectorCode: requireMappedValue(
            getActivitySectorCode(record.activitySector.trim()),
            record.activitySector,
            "secteur d’activité",
            record,
        ),
        age: record.age,
        annualRevenue: normalizeOptionalSourceValue(record.annualRevenue),
        avatarUrl: "",
        childrenCount: record.childrenCount,
        company: record.company,
        companyDescription: record.companyDescription,
        cv: null,
        diploma: record.diploma,
        discProfile: record.discProfile,
        employeeCount: normalizeOptionalSourceValue(record.employeeCount),
        maritalStatus: record.maritalStatus,
        name: record.name,
        nationality: record.nationality,
        netIncomeBeforeTax: record.netIncomeBeforeTax,
        pcsGroupCode: requireMappedValue(
            getPersonaPcsGroupCode(record.csp.trim()),
            record.csp,
            "CSP INSEE",
            record,
        ),
        residenceCountry: record.residenceCountry,
        role: record.role,
        sexCode: requireMappedValue(
            getPersonaSexCode(record.sex.trim()),
            record.sex,
            "sexe",
            record,
        ),
        status: CONTENT_STATUS.draft,
        systemInstructions: buildSystemInstructions(record),
        voiceId: record.voice.trim().toLowerCase(),
    });

    if (!result.success) {
        const issues = result.error.issues.map(({ message, path }) => `${path.join(".")}: ${message}`);
        throw new Error(`${getImportErrorPrefix(record)} : ${issues.join(" ; ")}`);
    }

    return result.data;
}

export function preparePersonaImport(records: PersonaImportSourceRecord[]) {
    const names = new Set<string>();

    return records.map((record) => {
        const normalizedName = record.name.trim().toLocaleLowerCase("fr");
        if (names.has(normalizedName)) {
            throw new Error(`Nom de persona dupliqué dans l’import : ${record.name}`);
        }
        names.add(normalizedName);
        return preparePersonaImportRecord(record);
    });
}

export function createPersonaImportRows(
    records: PersonaImportSourceRecord[],
    options: {
        createId?: () => string;
        now: string;
    },
) {
    const createId = options.createId ?? randomUUID;

    return preparePersonaImport(records).map((input) => createPersonaInsert(input, {
        avatarUrl: null,
        createdBy: null,
        id: createId(),
        now: options.now,
        status: CONTENT_STATUS.draft,
    }));
}
