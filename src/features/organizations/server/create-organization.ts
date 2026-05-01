import { AppError } from "@/lib/server/errors";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/auth/server";
import type { CreateOrganizationDto } from "@/features/organizations/dto/create-organization.dto";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    mapOrganizationRowToListItem,
    type OrganizationRow,
} from "./organization.mapper";

function isPostgresError(error: unknown): error is { code?: string } {
    return typeof error === "object" && error !== null && "code" in error;
}

export async function createOrganization(input: CreateOrganizationDto): Promise<OrganizationListItem> {
    await requireAdmin();

    const supabase = await createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("organizations")
        .insert({
            contact_email: input.contactEmail || null,
            created_at: now,
            industry: input.industry || null,
            name: input.name,
            phone: input.phone || null,
            region: input.region || null,
            status: input.status,
            updated_at: now,
        })
        .select("id, name, status, created_at")
        .single<OrganizationRow>();

    if (error) {
        if (isPostgresError(error) && error.code === "23505") {
            throw new AppError("Une organisation avec ce nom existe déjà.", 409, "ORGANIZATION_ALREADY_EXISTS");
        }

        throw error;
    }

    return mapOrganizationRowToListItem(data);
}
