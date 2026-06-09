import { NotFoundError } from "@/lib/server/errors";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import {
    mapOrganizationRowToDetail,
    type OrganizationDetailRow,
} from "./organization.mapper";

const organizationDetailSelect = "id, name, status, created_at, industry, contact_email, phone, region";

export async function getOrganizationDetail(organizationId: string): Promise<OrganizationDetail> {
    await requireAdmin();

    const supabase = await createClient();

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

    const [membershipsResult, groupsResult] = await Promise.all([
        supabase
            .from("organization_members")
            .select("organization_id")
            .eq("organization_id", organizationId),
        supabase
            .from("groups")
            .select("organization_id")
            .eq("organization_id", organizationId)
            .eq("status", "active"),
    ]);

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    return mapOrganizationRowToDetail({
        ...data,
        group_count: groupsResult.data?.length ?? 0,
        user_count: membershipsResult.data?.length ?? 0,
    });
}
