import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    mapOrganizationRowToListItem,
    type OrganizationRow,
} from "./organization.mapper";

interface OrganizationMemberCountRow {
    organization_id: string | null;
}

interface OrganizationGroupCountRow {
    organization_id: string | null;
}

function countMembersByOrganizationId(rows: OrganizationMemberCountRow[]) {
    return rows.reduce<Map<string, number>>((counts, row) => {
        if (!row.organization_id) {
            return counts;
        }

        counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);

        return counts;
    }, new Map<string, number>());
}

function countGroupsByOrganizationId(rows: OrganizationGroupCountRow[]) {
    return rows.reduce<Map<string, number>>((counts, row) => {
        if (!row.organization_id) {
            return counts;
        }

        counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);

        return counts;
    }, new Map<string, number>());
}

export async function listOrganizations(): Promise<OrganizationListItem[]> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: organizations, error } = await supabase
        .from("organizations")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .returns<OrganizationRow[]>();

    if (error) {
        throw error;
    }

    const [membershipsResult, groupsResult] = await Promise.all([
        supabase
            .from("organization_members")
            .select("organization_id")
            .returns<OrganizationMemberCountRow[]>(),
        supabase
            .from("groups")
            .select("organization_id")
            .eq("status", "active")
            .returns<OrganizationGroupCountRow[]>(),
    ]);

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    const memberCounts = countMembersByOrganizationId(membershipsResult.data ?? []);
    const groupCounts = countGroupsByOrganizationId(groupsResult.data ?? []);

    return (organizations ?? []).map((organization) =>
        mapOrganizationRowToListItem({
            ...organization,
            group_count: groupCounts.get(organization.id) ?? 0,
            user_count: memberCounts.get(organization.id) ?? 0,
        })
    );
}
