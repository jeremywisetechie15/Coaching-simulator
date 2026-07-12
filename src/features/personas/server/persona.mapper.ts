import type {
    PersonaEditorValues,
    PersonaDetail,
    PersonaListItem,
} from "@/features/personas/domain/persona-list";
import { CONTENT_STATUS, normalizeContentStatus, type ContentStatus } from "@/features/content/domain";
import { getPersonaAvatarPublicUrl } from "@/features/personas/domain/persona-list";
import {
    PERSONA_DISC_PROFILE,
    PERSONA_DISC_PROFILES,
    PERSONA_BUSINESS_SECTORS,
    type PersonaBusinessSector,
    type PersonaDiscProfile,
} from "@/features/personas/domain/persona-profile";
import { getOpenAIRealtimeVoice, isOpenAIRealtimeVoiceId } from "@/lib/openai/realtime-voices";

export const PERSONA_SELECT =
    "id, name, role, company, industry, employee_count, annual_revenue, company_description, disc_profile, age, children_count, diploma, marital_status, nationality, net_income_before_tax, residence_country, voice_id, system_instructions, avatar_url, created_at, updated_at, status";

export interface PersonaRow {
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
    residence_country: string | null;
    role: string | null;
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
    return PERSONA_DISC_PROFILES.includes(value as PersonaDiscProfile)
        ? (value as PersonaDiscProfile)
        : PERSONA_DISC_PROFILE.stable;
}

function normalizePersonaBusinessSector(value: string | null | undefined): PersonaBusinessSector | "" {
    return PERSONA_BUSINESS_SECTORS.includes(value as PersonaBusinessSector)
        ? (value as PersonaBusinessSector)
        : "";
}

export function mapPersonaRowToListItem(row: PersonaRow): PersonaListItem {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url),
        company: row.company ?? "",
        id: row.id,
        name: row.name,
        role: row.role ?? "",
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceId: row.voice_id,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}

export function mapPersonaRowToEditorValues(row: PersonaRow): PersonaEditorValues {
    const voiceId = row.voice_id && isOpenAIRealtimeVoiceId(row.voice_id) ? row.voice_id : "alloy";

    return {
        age: formatOptionalNumber(row.age),
        annualRevenue: row.annual_revenue ?? "",
        avatarUrl: row.avatar_url ?? "",
        childrenCount: formatOptionalNumber(row.children_count),
        company: row.company ?? "",
        companyDescription: row.company_description ?? "",
        diploma: row.diploma ?? "",
        discProfile: normalizePersonaDiscProfile(row.disc_profile),
        employeeCount: formatOptionalNumber(row.employee_count),
        industry: normalizePersonaBusinessSector(row.industry),
        maritalStatus: row.marital_status ?? "",
        name: row.name,
        nationality: row.nationality ?? "",
        netIncomeBeforeTax: row.net_income_before_tax ?? "",
        residenceCountry: row.residence_country ?? "",
        role: row.role ?? "",
        systemInstructions: row.system_instructions,
        voiceId,
    };
}

export function mapPersonaRowToDetail(row: PersonaRow): PersonaDetail {
    const voice = getOpenAIRealtimeVoice(row.voice_id);

    return {
        ...mapPersonaRowToEditorValues(row),
        avatarUrl: getPersonaAvatarPublicUrl(row.avatar_url) ?? "",
        createdAt: row.created_at,
        id: row.id,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.published),
        updatedAt: row.updated_at,
        voiceCharacteristic: voice?.characteristic ?? null,
        voiceName: voice?.name ?? row.voice_id ?? "Non configurée",
    };
}
