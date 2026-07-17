import { requireAdmin } from "@/features/auth/server";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
} from "@/features/organizations/domain/organization-content-scope";
import {
    ORGANIZATION_GROUP_STATUS,
    type OrganizationGroupRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationGroupRow, type OrganizationGroupDbRow } from "./organization-group.mapper";

interface GroupMemberCountRow {
    group_id: string | null;
    user_id: string | null;
}

interface OrganizationMemberCountRow {
    user_id: string | null;
}

interface GroupContentCountRow {
    group_id: string | null;
    id: string;
}

function countRosterMembersByGroupId(
    rows: GroupMemberCountRow[],
    rosterUserIds: ReadonlySet<string>,
) {
    const userIdsByGroupId = new Map<string, Set<string>>();

    for (const row of rows) {
        if (!row.group_id || !row.user_id || !rosterUserIds.has(row.user_id)) {
            continue;
        }

        const userIds = userIdsByGroupId.get(row.group_id) ?? new Set<string>();
        userIds.add(row.user_id);
        userIdsByGroupId.set(row.group_id, userIds);
    }

    return new Map(
        Array.from(userIdsByGroupId, ([groupId, userIds]) => [groupId, userIds.size]),
    );
}

function countUniqueContentByGroupId(rows: GroupContentCountRow[]) {
    const contentIdsByGroupId = new Map<string, Set<string>>();

    for (const row of rows) {
        if (!row.group_id) {
            continue;
        }

        const contentIds = contentIdsByGroupId.get(row.group_id) ?? new Set<string>();
        contentIds.add(row.id);
        contentIdsByGroupId.set(row.group_id, contentIds);
    }

    return new Map(
        Array.from(contentIdsByGroupId, ([groupId, contentIds]) => [groupId, contentIds.size]),
    );
}

export async function listOrganizationGroups(organizationId: string): Promise<OrganizationGroupRow[]> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: groups, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, description, status, created_at")
        .eq("organization_id", organizationId)
        .eq("status", ORGANIZATION_GROUP_STATUS.active)
        .order("created_at", { ascending: true })
        .returns<OrganizationGroupDbRow[]>();

    if (groupsError) {
        throw groupsError;
    }

    const groupIds = (groups ?? []).map((group) => group.id);

    if (groupIds.length === 0) {
        return [];
    }

    const [membersResult, organizationMembersResult, roleplaysResult, quizzesResult] = await Promise.all([
        supabase
            .from("group_members")
            .select("group_id, user_id")
            .in("group_id", groupIds)
            .returns<GroupMemberCountRow[]>(),
        supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", organizationId)
            .neq("status", ORGANIZATION_MEMBER_STATUS.removed)
            .returns<OrganizationMemberCountRow[]>(),
        supabase
            .from("scenarios")
            .select("id, group_id")
            .in("group_id", groupIds)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<GroupContentCountRow[]>(),
        supabase
            .from("quizzes")
            .select("id, group_id")
            .in("group_id", groupIds)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<GroupContentCountRow[]>(),
    ]);

    if (membersResult.error) {
        throw membersResult.error;
    }

    if (organizationMembersResult.error) {
        throw organizationMembersResult.error;
    }

    if (roleplaysResult.error) {
        throw roleplaysResult.error;
    }

    if (quizzesResult.error) {
        throw quizzesResult.error;
    }

    const rosterUserIds = new Set(
        (organizationMembersResult.data ?? [])
            .map((membership) => membership.user_id)
            .filter((userId): userId is string => Boolean(userId)),
    );
    const memberCounts = countRosterMembersByGroupId(membersResult.data ?? [], rosterUserIds);
    const roleplayCounts = countUniqueContentByGroupId(roleplaysResult.data ?? []);
    const quizCounts = countUniqueContentByGroupId(quizzesResult.data ?? []);

    return (groups ?? []).map((group) =>
        mapOrganizationGroupRow(
            group,
            memberCounts.get(group.id) ?? 0,
            roleplayCounts.get(group.id) ?? 0,
            quizCounts.get(group.id) ?? 0,
        ),
    );
}
