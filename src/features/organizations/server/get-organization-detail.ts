import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import {
    mapOrganizationRowToDetail,
    type OrganizationDetailRow,
} from "./organization.mapper";
import { listOrganizationContentScope } from "./list-organization-content-scope";

const organizationDetailSelect = "id, name, status, created_at, industry, contact_email, phone, region";

export async function getOrganizationDetail(organizationId: string): Promise<OrganizationDetail> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("organizations")
        .select(organizationDetailSelect)
        .eq("id", organizationId)
        .maybeSingle<OrganizationDetailRow>();

    if (error) {
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
