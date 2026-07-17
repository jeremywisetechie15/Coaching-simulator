import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { CreateOrganizationDto } from "@/features/organizations/dto/create-organization.dto";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import {
    mapOrganizationRowToDetail,
    type OrganizationDetailRow,
} from "./organization.mapper";
import { listOrganizationContentScope } from "./list-organization-content-scope";

const organizationDetailSelect = "id, name, status, created_at, industry, contact_email, phone, region";

function isPostgresError(error: unknown): error is { code?: string } {
    return typeof error === "object" && error !== null && "code" in error;
}

export async function updateOrganization(
    organizationId: string,
    input: CreateOrganizationDto
): Promise<OrganizationDetail> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("organizations")
        .update({
            contact_email: input.contactEmail || null,
            industry: input.industry || null,
            name: input.name,
            phone: input.phone || null,
            region: input.region || null,
            status: input.status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)
        .select(organizationDetailSelect)
        .maybeSingle<OrganizationDetailRow>();

    if (error) {
        if (isPostgresError(error) && error.code === "23505") {
            throw new AppError("Une organisation avec ce nom existe déjà.", 409, "ORGANIZATION_ALREADY_EXISTS");
        }

        throw error;
    }

    if (!data) {
        throw new NotFoundError("Organisation introuvable.");
    }

    const contentScope = await listOrganizationContentScope(supabase, [organizationId]);
    const counts = contentScope.countsByOrganizationId.get(organizationId);

    return mapOrganizationRowToDetail({
        ...data,
        group_count: counts?.groupCount ?? 0,
        program_count: counts?.roleplayCount ?? 0,
        user_count: counts?.userCount ?? 0,
    });
}
