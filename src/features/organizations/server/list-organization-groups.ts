import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";
import { mapOrganizationGroupRow, type OrganizationGroupDbRow } from "./organization-group.mapper";

interface GroupMemberCountRow {
    group_id: string | null;
}

function countMembersByGroupId(rows: GroupMemberCountRow[]) {
    return rows.reduce<Map<string, number>>((counts, row) => {
        if (!row.group_id) {
            return counts;
        }

        counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);

        return counts;
    }, new Map<string, number>());
}

export async function listOrganizationGroups(organizationId: string): Promise<OrganizationGroupRow[]> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, description, status, created_at")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true })
        .returns<OrganizationGroupDbRow[]>();

    if (groupsError) {
        throw groupsError;
    }

    const groupIds = (groups ?? []).map((group) => group.id);

    if (groupIds.length === 0) {
        return [];
    }

    const { data: members, error: membersError } = await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds)
        .returns<GroupMemberCountRow[]>();

    if (membersError) {
        throw membersError;
    }

    const memberCounts = countMembersByGroupId(members ?? []);

    return (groups ?? []).map((group) => mapOrganizationGroupRow(group, memberCounts.get(group.id) ?? 0));
}
