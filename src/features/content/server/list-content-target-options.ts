import { requireAdmin } from "@/features/auth/server";
import type {
    ContentTargetGroupOption,
    ContentTargetOrganizationOption,
    ContentTargetUserOption,
} from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { createAdminClient } from "@/lib/supabase/admin";

interface ContentTargetProfileRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
}

interface ContentTargetOrganizationRow {
    id: string;
    name: string;
    status: string | null;
}

interface ContentTargetGroupRow {
    id: string;
    name: string;
    organization_id: string | null;
    status: string | null;
}

interface ContentTargetOrganizationMemberRow {
    organization_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface ContentTargetGroupMemberRow {
    group_id: string | null;
    user_id: string | null;
}

export interface ContentTargetCurrentSelection {
    groupId?: string | null;
    organizationId?: string | null;
    userId?: string | null;
}

export interface ContentTargetOptions {
    groups: ContentTargetGroupOption[];
    organizations: ContentTargetOrganizationOption[];
    users: ContentTargetUserOption[];
}

interface ResolveContentTargetOptionsInput {
    current?: ContentTargetCurrentSelection;
    groupMembers: ContentTargetGroupMemberRow[];
    groups: ContentTargetGroupRow[];
    organizationMembers: ContentTargetOrganizationMemberRow[];
    organizations: ContentTargetOrganizationRow[];
    profiles: ContentTargetProfileRow[];
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
    const values = map.get(key) ?? new Set<string>();
    values.add(value);
    map.set(key, values);
}

function getProfileName(profile: ContentTargetProfileRow) {
    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    return fullName || profile.name || profile.email || "Utilisateur";
}

export function resolveContentTargetOptions({
    current = {},
    groupMembers,
    groups,
    organizationMembers,
    organizations,
    profiles,
}: ResolveContentTargetOptionsInput): ContentTargetOptions {
    const activeOrganizationIds = new Set(
        organizations
            .filter((organization) => organization.status === ORGANIZATION_STATUS.active)
            .map((organization) => organization.id),
    );
    const activeGroups = groups.filter(
        (group) =>
            group.status === ORGANIZATION_GROUP_STATUS.active
            && Boolean(group.organization_id)
            && activeOrganizationIds.has(group.organization_id ?? ""),
    );
    const activeGroupById = new Map(activeGroups.map((group) => [group.id, group]));
    const activeOrganizationIdsByUser = new Map<string, Set<string>>();

    for (const membership of organizationMembers) {
        if (
            !membership.user_id
            || !membership.organization_id
            || membership.status !== ORGANIZATION_MEMBER_STATUS.active
            || !activeOrganizationIds.has(membership.organization_id)
        ) {
            continue;
        }

        addToSetMap(activeOrganizationIdsByUser, membership.user_id, membership.organization_id);
    }

    const activeGroupIdsByUser = new Map<string, Set<string>>();
    for (const membership of groupMembers) {
        if (!membership.user_id || !membership.group_id) continue;
        const group = activeGroupById.get(membership.group_id);
        if (!group?.organization_id) continue;
        if (!activeOrganizationIdsByUser.get(membership.user_id)?.has(group.organization_id)) continue;

        addToSetMap(activeGroupIdsByUser, membership.user_id, membership.group_id);
    }

    const organizationsOptions = organizations
        .filter((organization) =>
            activeOrganizationIds.has(organization.id) || organization.id === current.organizationId
        )
        .map((organization) => ({
            id: organization.id,
            isSelectable: activeOrganizationIds.has(organization.id),
            name: organization.name,
        }))
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));

    const groupOptions = groups
        .filter((group) =>
            activeGroupById.has(group.id) || group.id === current.groupId
        )
        .flatMap((group) =>
            group.organization_id
                ? [{
                      id: group.id,
                      isSelectable: activeGroupById.has(group.id),
                      name: group.name,
                      organizationId: group.organization_id,
                  }]
                : []
        )
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));

    const users = profiles
        .filter((profile) =>
            activeOrganizationIdsByUser.has(profile.id) || profile.id === current.userId
        )
        .map((profile) => {
            const activeOrganizationIdsForUser = activeOrganizationIdsByUser.get(profile.id) ?? new Set<string>();
            const activeGroupIdsForUser = activeGroupIdsByUser.get(profile.id) ?? new Set<string>();
            const organizationIds = new Set(activeOrganizationIdsForUser);
            const groupIds = new Set(activeGroupIdsForUser);

            if (profile.id === current.userId) {
                if (current.organizationId) organizationIds.add(current.organizationId);
                if (current.groupId) groupIds.add(current.groupId);
            }

            return {
                groupIds: [...groupIds],
                id: profile.id,
                isSelectable: activeOrganizationIdsForUser.size > 0,
                name: getProfileName(profile),
                organizationIds: [...organizationIds],
            };
        })
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));

    return {
        groups: groupOptions,
        organizations: organizationsOptions,
        users,
    };
}

export async function listContentTargetOptions(
    current: ContentTargetCurrentSelection = {},
): Promise<ContentTargetOptions> {
    await requireAdmin();
    const supabase = createAdminClient();
    const [
        profilesResult,
        organizationsResult,
        groupsResult,
        organizationMembersResult,
        groupMembersResult,
    ] = await Promise.all([
        supabase
            .from("profiles")
            .select("id, name, first_name, last_name, email")
            .returns<ContentTargetProfileRow[]>(),
        supabase
            .from("organizations")
            .select("id, name, status")
            .returns<ContentTargetOrganizationRow[]>(),
        supabase
            .from("groups")
            .select("id, name, organization_id, status")
            .returns<ContentTargetGroupRow[]>(),
        supabase
            .from("organization_members")
            .select("user_id, organization_id, status")
            .returns<ContentTargetOrganizationMemberRow[]>(),
        supabase
            .from("group_members")
            .select("user_id, group_id")
            .returns<ContentTargetGroupMemberRow[]>(),
    ]);

    const error = profilesResult.error
        ?? organizationsResult.error
        ?? groupsResult.error
        ?? organizationMembersResult.error
        ?? groupMembersResult.error;
    if (error) throw error;

    return resolveContentTargetOptions({
        current,
        groupMembers: groupMembersResult.data ?? [],
        groups: groupsResult.data ?? [],
        organizationMembers: organizationMembersResult.data ?? [],
        organizations: organizationsResult.data ?? [],
        profiles: profilesResult.data ?? [],
    });
}
