import type {
    PersonaEditorValues,
    PersonaDetail,
    PersonaListItem,
} from "@/features/personas/domain/persona-list";
import { CONTENT_STATUS, normalizeContentStatus, type ContentStatus } from "@/features/content/domain";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";
import {
    PERSONA_DISC_PROFILE,
    isPersonaDiscProfile,
    type PersonaDiscProfile,
} from "@/features/personas/domain/persona-profile";
import {
    getActivitySectorCode,
    isActivitySectorCode,
    type ActivitySectorCode,
} from "@/features/content/domain";
import {
    isPersonaPcsGroupCode,
    isPersonaSexCode,
    type PersonaPcsGroupCode,
    type PersonaSexCode,
} from "@/features/personas/domain/persona-demographics";
import {
    getOpenAIRealtimeVoice,
    resolveOpenAIRealtimeVoiceId,
} from "@/lib/openai/realtime-voices";

export const PERSONA_SELECT =
    "id, name, role, company, activity_sector_code, industry, employee_count, annual_revenue, company_description, disc_profile, age, sex_code, pcs_group_code, children_count, diploma, marital_status, nationality, net_income_before_tax, residence_country, voice_id, system_instructions, avatar_url, created_at, updated_at, status";

export interface PersonaRow {
    activity_sector_code: string | null;
    age: number | null;
    annual_revenue: string | null;
    avatar_url: string | null;
    children_count: number | null;
    company: string | null;
    company_description: string | null;
    created_at: string | null;
    diploma: string | null;
    disc_profile: string | null;
    employee_count: number | null;
    id: string;
    industry: string | null;
    marital_status: string | null;
    name: string;
    nationality: string | null;
    net_income_before_tax: string | null;
    pcs_group_code: string | null;
    residence_country: string | null;
    role: string | null;
    sex_code: string | null;
    status?: ContentStatus | string | null;
    system_instructions: string;
    updated_at: string | null;
    voice_id: string | null;
}

function formatOptionalNumber(value: number | null | undefined) {
    return typeof value === "number" ? String(value) : "";
}

export function toNullableInteger(value: string) {
    const trimmedValue = value.trim();

    return trimmedValue ? Number(trimmedValue) : null;
}

function normalizePersonaDiscProfile(value: string | null | undefined): PersonaDiscProfile {
    return isPersonaDiscProfile(value)
        ? (value as PersonaDiscProfile)
        : PERSONA_DISC_PROFILE.stable;
}

function normalizeActivitySectorCode(
    value: string | null | undefined,
    legacyIndustry: string | null | undefined,
): ActivitySectorCode | null {
    if (isActivitySectorCode(value)) return value;
    return getActivitySectorCode(legacyIndustry);
}

function normalizePersonaSexCode(value: string | null | undefined): PersonaSexCode | null {
    return isPersonaSexCode(value) ? value : null;
}

function normalizePersonaPcsGroupCode(value: string | null | undefined): PersonaPcsGroupCode | null {
    return isPersonaPcsGroupCode(value) ? value : null;
}

export function mapPersonaRowToListItem(row: PersonaRow): PersonaListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        activitySectorCode: normalizeActivitySectorCode(row.activity_sector_code, row.industry),
        ageYears: row.age,
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url),
        company: row.company ?? "",
        discProfile: normalizePersonaDiscProfile(row.disc_profile),
        employeeCountValue: row.employee_count,
        id: row.id,
        name: row.name,
        pcsGroupCode: normalizePersonaPcsGroupCode(row.pcs_group_code),
        role: row.role ?? "",
        sexCode: normalizePersonaSexCode(row.sex_code),
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}

export function mapPersonaRowToEditorValues(row: PersonaRow): PersonaEditorValues {
    const voiceId = resolveOpenAIRealtimeVoiceId(row.voice_id);

    return {
        activitySectorCode: normalizeActivitySectorCode(row.activity_sector_code, row.industry),
        age: formatOptionalNumber(row.age),
        annualRevenue: row.annual_revenue ?? "",
        avatarUrl: row.avatar_url ?? "",
        childrenCount: formatOptionalNumber(row.children_count),
        company: row.company ?? "",
        companyDescription: row.company_description ?? "",
        diploma: row.diploma ?? "",
        discProfile: normalizePersonaDiscProfile(row.disc_profile),
        employeeCount: formatOptionalNumber(row.employee_count),
        maritalStatus: row.marital_status ?? "",
        name: row.name,
        nationality: row.nationality ?? "",
        netIncomeBeforeTax: row.net_income_before_tax ?? "",
        pcsGroupCode: normalizePersonaPcsGroupCode(row.pcs_group_code),
        residenceCountry: row.residence_country ?? "",
        role: row.role ?? "",
        sexCode: normalizePersonaSexCode(row.sex_code),
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        systemInstructions: row.system_instructions,
        voiceId,
    };
}

export function mapPersonaRowToDetail(row: PersonaRow): PersonaDetail {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        ...mapPersonaRowToEditorValues(row),
        ageYears: row.age,
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url) ?? "",
        createdAt: row.created_at,
        employeeCountValue: row.employee_count,
        id: row.id,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        updatedAt: row.updated_at,
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}
