import type { ContentStatus } from "@/features/content/domain";
import type { SavePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { toNullableInteger } from "./persona.mapper";

interface PersonaInsertContext {
    avatarUrl: string | null;
    createdBy: string;
    id: string;
    now: string;
    status: ContentStatus;
}

export function createPersonaInsert(input: SavePersonaDto, context: PersonaInsertContext) {
    return {
        age: toNullableInteger(input.age),
        annual_revenue: input.annualRevenue || null,
        avatar_url: context.avatarUrl,
        children_count: toNullableInteger(input.childrenCount),
        company: input.company || null,
        company_description: input.companyDescription || null,
        created_at: context.now,
        created_by: context.createdBy,
        diploma: input.diploma || null,
        disc_profile: input.discProfile || null,
        employee_count: toNullableInteger(input.employeeCount),
        id: context.id,
        industry: input.industry || null,
        marital_status: input.maritalStatus || null,
        name: input.name,
        nationality: input.nationality || null,
        net_income_before_tax: input.netIncomeBeforeTax || null,
        residence_country: input.residenceCountry || null,
        role: input.role || null,
        status: context.status,
        system_instructions: input.systemInstructions,
        updated_at: context.now,
        voice_id: input.voiceId,
    };
}
