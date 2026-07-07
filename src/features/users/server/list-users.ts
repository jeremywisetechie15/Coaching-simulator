import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import {
    PLATFORM_ROLE,
    USER_ROLE,
    USER_STATUS,
    type UserListItem,
    type UserRole,
    type UserStatus,
} from "@/features/users/domain/users";
import {
    ORGANIZATION_MEMBER_ROLE,
    ORGANIZATION_MEMBER_STATUS,
} from "@/features/organizations/domain/organization-member";

interface ProfileRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
    platform_role: string | null;
}

interface MembershipRow {
    organization_id: string | null;
    role: string | null;
    status: string | null;
    user_id: string | null;
}

interface OrganizationRow {
    id: string;
    name: string;
}

interface GroupMemberRow {
    group_id: string | null;
    user_id: string | null;
}

interface GroupRow {
    id: string;
    name: string;
}

const profileSelect = "id, email, name, first_name, last_name, platform_role";

function formatLongDate(value: string | undefined) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function formatDateTime(value: string | undefined) {
    if (!value) {
        return "Jamais connecté";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function getMetadataString(user: SupabaseUser | undefined, key: string) {
    const value = user?.user_metadata?.[key];

    return typeof value === "string" ? value : "";
}

function getDisplayName(profile: ProfileRow | undefined, authUser: SupabaseUser | undefined, email: string) {
    const firstName = profile?.first_name || getMetadataString(authUser, "first_name");
    const lastName = profile?.last_name || getMetadataString(authUser, "last_name");
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || profile?.name || getMetadataString(authUser, "name") || email.split("@")[0] || "Utilisateur";
}

function getInitials(name: string, email: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);

    return (initials || email.slice(0, 2) || "UT").toUpperCase();
}

function getUserRole(profile: ProfileRow | undefined, memberships: MembershipRow[]): UserRole {
    if (profile?.platform_role === PLATFORM_ROLE.admin) {
        return USER_ROLE.admin;
    }

    if (memberships.some((membership) => membership.role === ORGANIZATION_MEMBER_ROLE.manager)) {
        return USER_ROLE.manager;
    }

    return USER_ROLE.learner;
}

function getUserStatus(profile: ProfileRow | undefined, memberships: MembershipRow[]): UserStatus {
    if (memberships.some((membership) => membership.status === ORGANIZATION_MEMBER_STATUS.active)) {
        return USER_STATUS.active;
    }

    if (memberships.some((membership) => membership.status === ORGANIZATION_MEMBER_STATUS.invited)) {
        return USER_STATUS.pending;
    }

    if (
        memberships.some(
            (membership) =>
                membership.status === ORGANIZATION_MEMBER_STATUS.suspended ||
                membership.status === ORGANIZATION_MEMBER_STATUS.removed,
        )
    ) {
        return USER_STATUS.inactive;
    }

    return profile?.platform_role === PLATFORM_ROLE.admin ? USER_STATUS.active : USER_STATUS.pending;
}

function getOrganizationLabel(
    profile: ProfileRow | undefined,
    memberships: MembershipRow[],
    organizationsById: Map<string, string>
) {
    const organizationNames = Array.from(
        new Set(
            memberships.flatMap((membership) => {
                if (!membership.organization_id) {
                    return [];
                }

                const organizationName = organizationsById.get(membership.organization_id);

                return organizationName ? [organizationName] : [];
            })
        )
    );

    if (organizationNames.length > 0) {
        return organizationNames.join(", ");
    }

    return profile?.platform_role === PLATFORM_ROLE.admin ? "Plateforme" : "Aucune organisation";
}

export async function listUsers(): Promise<UserListItem[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();

    const [profilesResult, membershipsResult, organizationsResult, groupMembersResult, groupsResult, authUsersResult] = await Promise.all([
        adminSupabase.from("profiles").select(profileSelect).order("email", { ascending: true }).returns<ProfileRow[]>(),
        adminSupabase
            .from("organization_members")
            .select("user_id, organization_id, role, status")
            .returns<MembershipRow[]>(),
        adminSupabase.from("organizations").select("id, name").returns<OrganizationRow[]>(),
        adminSupabase.from("group_members").select("user_id, group_id").returns<GroupMemberRow[]>(),
        adminSupabase.from("groups").select("id, name").returns<GroupRow[]>(),
        adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);

    if (profilesResult.error) {
        throw profilesResult.error;
    }

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    if (organizationsResult.error) {
        throw organizationsResult.error;
    }

    if (groupMembersResult.error) {
        throw groupMembersResult.error;
    }

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    if (authUsersResult.error) {
        throw authUsersResult.error;
    }

    const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
    const authUsersById = new Map(authUsersResult.data.users.map((user) => [user.id, user]));
    const organizationsById = new Map((organizationsResult.data ?? []).map((organization) => [organization.id, organization.name]));
    const groupsById = new Map((groupsResult.data ?? []).map((group) => [group.id, group.name]));
    const membershipsByUserId = new Map<string, MembershipRow[]>();
    const groupNamesByUserId = new Map<string, string[]>();

    for (const membership of membershipsResult.data ?? []) {
        if (!membership.user_id) {
            continue;
        }

        membershipsByUserId.set(membership.user_id, [...(membershipsByUserId.get(membership.user_id) ?? []), membership]);
    }

    for (const groupMember of groupMembersResult.data ?? []) {
        if (!groupMember.user_id || !groupMember.group_id) {
            continue;
        }

        const groupName = groupsById.get(groupMember.group_id);

        if (!groupName) {
            continue;
        }

        const currentGroupNames = groupNamesByUserId.get(groupMember.user_id) ?? [];

        if (!currentGroupNames.includes(groupName)) {
            groupNamesByUserId.set(groupMember.user_id, [...currentGroupNames, groupName]);
        }
    }

    const userIds = Array.from(new Set([...profilesById.keys(), ...authUsersById.keys()]));

    return userIds
        .map((userId) => {
            const profile = profilesById.get(userId);
            const authUser = authUsersById.get(userId);
            const memberships = membershipsByUserId.get(userId) ?? [];
            const email = profile?.email || authUser?.email || "";
            const name = getDisplayName(profile, authUser, email);
            const status = getUserStatus(profile, memberships);

            return {
                activity: [
                    {
                        date: status === "pending" ? "Invitation envoyée" : "Compte créé",
                        id: `${userId}-account`,
                        label: status === "pending" ? "Invitation en attente" : "Compte actif",
                        type: "Compte",
                    },
                ],
                city: "",
                email,
                group: (groupNamesByUserId.get(userId) ?? []).join(", "),
                id: userId,
                initials: getInitials(name, email),
                joinedAt: formatLongDate(authUser?.created_at),
                lastActiveAt: formatDateTime(authUser?.last_sign_in_at),
                name,
                organization: getOrganizationLabel(profile, memberships, organizationsById),
                phone: authUser?.phone ?? "",
                progress: 0,
                role: getUserRole(profile, memberships),
                roleplays: [],
                skills: [],
                status,
                trainings: [],
            };
        })
        .sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name, "fr-FR"));
}
