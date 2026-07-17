import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import {
    ORGANIZATION_GROUP_STATUS,
    type OrganizationGroupStatus,
} from "@/features/organizations/domain/organization-detail";
import type { UserTargetContext } from "./user-assignment-visibility";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AssignmentTargetOrganizationMembershipRow {
    organization_id: string | null;
    status: string | null;
    user_id: string | null;
}

export interface AssignmentTargetOrganizationRow {
    id: string;
    status: string | null;
}

export interface AssignmentTargetGroupMembershipRow {
    group_id: string | null;
    user_id: string | null;
}

export interface AssignmentTargetGroupRow {
    id: string;
    organization_id: string | null;
    status: OrganizationGroupStatus | null;
}

interface MutableUserTargetContext {
    groupIds: Set<string>;
    organizationIds: Set<string>;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

export function resolveActiveUserAssignmentTargets({
    groupMemberships,
    groups,
    organizationMemberships,
    organizations,
    userIds,
}: {
    groupMemberships: AssignmentTargetGroupMembershipRow[];
    groups: AssignmentTargetGroupRow[];
    organizationMemberships: AssignmentTargetOrganizationMembershipRow[];
    organizations: AssignmentTargetOrganizationRow[];
    userIds: string[];
}): Map<string, UserTargetContext> {
    const targetSetsByUserId = new Map<string, MutableUserTargetContext>(
        userIds.map((userId) => [
            userId,
            { groupIds: new Set<string>(), organizationIds: new Set<string>() },
        ]),
    );
    const activeOrganizationIds = new Set(
        organizations
            .filter((organization) => organization.status === ORGANIZATION_STATUS.active)
            .map((organization) => organization.id),
    );

    for (const membership of organizationMemberships) {
        if (
            !membership.user_id
            || !membership.organization_id
            || membership.status !== ORGANIZATION_MEMBER_STATUS.active
            || !activeOrganizationIds.has(membership.organization_id)
        ) {
            continue;
        }

        targetSetsByUserId.get(membership.user_id)?.organizationIds.add(membership.organization_id);
    }

    const groupsById = new Map(groups.map((group) => [group.id, group]));

    for (const membership of groupMemberships) {
        if (!membership.user_id || !membership.group_id) {
            continue;
        }

        const userTargets = targetSetsByUserId.get(membership.user_id);
        const group = groupsById.get(membership.group_id);

        if (
            !userTargets
            || !group?.organization_id
            || group.status !== ORGANIZATION_GROUP_STATUS.active
            || !userTargets.organizationIds.has(group.organization_id)
        ) {
            continue;
        }

        userTargets.groupIds.add(group.id);
    }

    return new Map(
        Array.from(targetSetsByUserId, ([userId, targets]) => [
            userId,
            {
                groupIds: Array.from(targets.groupIds).sort(),
                organizationIds: Array.from(targets.organizationIds).sort(),
            },
        ]),
    );
}

export async function listActiveUserAssignmentTargets(
    supabase: ReturnType<typeof createAdminClient>,
    userIds: string[],
): Promise<Map<string, UserTargetContext>> {
    const uniqueUserIds = uniqueValues(userIds);

    if (uniqueUserIds.length === 0) {
        return new Map();
    }

    const [organizationMembershipsResult, groupMembershipsResult] = await Promise.all([
        supabase
            .from("organization_members")
            .select("user_id, organization_id, status")
            .in("user_id", uniqueUserIds)
            .returns<AssignmentTargetOrganizationMembershipRow[]>(),
        supabase
            .from("group_members")
            .select("user_id, group_id")
            .in("user_id", uniqueUserIds)
            .returns<AssignmentTargetGroupMembershipRow[]>(),
    ]);

    if (organizationMembershipsResult.error) {
        throw organizationMembershipsResult.error;
    }

    if (groupMembershipsResult.error) {
        throw groupMembershipsResult.error;
    }

    const organizationMemberships = organizationMembershipsResult.data ?? [];
    const groupMemberships = groupMembershipsResult.data ?? [];
    const organizationIds = uniqueValues(organizationMemberships.map((row) => row.organization_id));
    const groupIds = uniqueValues(groupMemberships.map((row) => row.group_id));
    const [organizationsResult, groupsResult] = await Promise.all([
        organizationIds.length > 0
            ? supabase
                  .from("organizations")
                  .select("id, status")
                  .in("id", organizationIds)
                  .returns<AssignmentTargetOrganizationRow[]>()
            : Promise.resolve({ data: [] as AssignmentTargetOrganizationRow[], error: null }),
        groupIds.length > 0
            ? supabase
                  .from("groups")
                  .select("id, organization_id, status")
                  .in("id", groupIds)
                  .returns<AssignmentTargetGroupRow[]>()
            : Promise.resolve({ data: [] as AssignmentTargetGroupRow[], error: null }),
    ]);

    if (organizationsResult.error) {
        throw organizationsResult.error;
    }

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    return resolveActiveUserAssignmentTargets({
        groupMemberships,
        groups: groupsResult.data ?? [],
        organizationMemberships,
        organizations: organizationsResult.data ?? [],
        userIds: uniqueUserIds,
    });
}
