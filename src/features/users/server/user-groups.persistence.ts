import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import type { UserGroupAssignmentDto } from "@/features/users/dto";
import type { UserAssignedGroup, UserAvailableGroup, UserGroupsResult } from "@/features/users/domain/user-groups";

interface ProfileExistsRow {
    id: string;
}

interface UserOrganizationMembershipRow {
    organization_id: string | null;
    status: string | null;
}

export interface UserGroupDbRow {
    description: string | null;
    id: string;
    name: string;
    organization_id: string | null;
    status: string | null;
}

export interface UserGroupMemberDbRow {
    assigned_at: string | null;
    group_id: string | null;
}

const manageableMembershipStatuses = [
    ORGANIZATION_MEMBER_STATUS.active,
    ORGANIZATION_MEMBER_STATUS.invited,
    ORGANIZATION_MEMBER_STATUS.suspended,
];

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatAssignedAt(value: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function mapAvailableGroup(row: UserGroupDbRow): UserAvailableGroup {
    return {
        description: row.description ?? "",
        id: row.id,
        name: row.name,
    };
}

function mapAssignedGroup(row: UserGroupDbRow, membership: UserGroupMemberDbRow): UserAssignedGroup {
    return {
        ...mapAvailableGroup(row),
        assignedAt: formatAssignedAt(membership.assigned_at),
    };
}

export function createUserGroupsResult(
    organizationGroups: UserGroupDbRow[],
    memberships: UserGroupMemberDbRow[],
): UserGroupsResult {
    const membershipsByGroupId = new Map(
        memberships
            .filter((membership): membership is UserGroupMemberDbRow & { group_id: string } => Boolean(membership.group_id))
            .map((membership) => [membership.group_id, membership]),
    );

    return organizationGroups.reduce<UserGroupsResult>(
        (result, group) => {
            const membership = membershipsByGroupId.get(group.id);

            if (membership) {
                result.groups.push(mapAssignedGroup(group, membership));
            } else {
                result.availableGroups.push(mapAvailableGroup(group));
            }

            return result;
        },
        { availableGroups: [], groups: [] },
    );
}

async function ensureUserProfileExists(userId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle<ProfileExistsRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Utilisateur introuvable.");
    }
}

async function listUserOrganizationIds(userId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, status")
        .eq("user_id", userId)
        .in("status", manageableMembershipStatuses)
        .returns<UserOrganizationMembershipRow[]>();

    if (error) {
        throw error;
    }

    return uniqueValues((data ?? []).map((membership) => membership.organization_id));
}

export async function listUserGroups(userId: string): Promise<UserGroupsResult> {
    await requireAdmin();
    await ensureUserProfileExists(userId);

    const organizationIds = await listUserOrganizationIds(userId);

    if (organizationIds.length === 0) {
        return { availableGroups: [], groups: [] };
    }

    const supabase = createAdminClient();
    const [groupsResult, membershipsResult] = await Promise.all([
        supabase
            .from("groups")
            .select("id, organization_id, name, description, status")
            .in("organization_id", organizationIds)
            .eq("status", "active")
            .order("name", { ascending: true })
            .returns<UserGroupDbRow[]>(),
        supabase
            .from("group_members")
            .select("group_id, assigned_at")
            .eq("user_id", userId)
            .returns<UserGroupMemberDbRow[]>(),
    ]);

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    return createUserGroupsResult(groupsResult.data ?? [], membershipsResult.data ?? []);
}

export async function assignUserToGroup(
    userId: string,
    input: UserGroupAssignmentDto,
): Promise<UserGroupsResult> {
    await requireAdmin();
    await ensureUserProfileExists(userId);

    const supabase = createAdminClient();
    const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, organization_id, name, description, status")
        .eq("id", input.groupId)
        .maybeSingle<UserGroupDbRow>();

    if (groupError) {
        throw groupError;
    }

    if (!group || !group.organization_id) {
        throw new NotFoundError("Groupe introuvable.");
    }

    if (group.status !== "active") {
        throw new AppError("Ce groupe n'est pas actif.", 400, "GROUP_NOT_ACTIVE");
    }

    const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, status")
        .eq("user_id", userId)
        .eq("organization_id", group.organization_id)
        .in("status", manageableMembershipStatuses)
        .maybeSingle<UserOrganizationMembershipRow>();

    if (membershipError) {
        throw membershipError;
    }

    if (!membership) {
        throw new AppError("L'utilisateur n'appartient pas à l'organisation de ce groupe.", 400, "USER_NOT_IN_GROUP_ORGANIZATION");
    }

    const { error } = await supabase
        .from("group_members")
        .upsert(
            {
                group_id: input.groupId,
                user_id: userId,
            },
            { onConflict: "group_id,user_id" },
        );

    if (error) {
        throw error;
    }

    return listUserGroups(userId);
}

export async function removeUserFromGroup(
    userId: string,
    input: UserGroupAssignmentDto,
): Promise<UserGroupsResult> {
    await requireAdmin();

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("group_members")
        .delete()
        .eq("user_id", userId)
        .eq("group_id", input.groupId)
        .select("group_id")
        .maybeSingle<UserGroupMemberDbRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Affectation groupe introuvable.");
    }

    return listUserGroups(userId);
}
