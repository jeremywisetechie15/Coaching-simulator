import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationUserRow } from "@/features/organizations/domain/organization-detail";
import {
    getOrganizationMemberRoleLabel,
    isOrganizationMemberRole,
    isOrganizationMemberStatus,
    ORGANIZATION_MEMBER_ROLE,
    ORGANIZATION_MEMBER_STATUS,
    type OrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";
import {
    listOrganizationUserAssignmentCounts,
    type OrganizationUserAssignmentCounts,
} from "./list-organization-user-assignment-counts";

interface OrganizationExistsRow {
    id: string;
}

export interface OrganizationMembershipDbRow {
    role: string | null;
    status: string | null;
    user_id: string | null;
}

export interface OrganizationUserProfileDbRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function getDisplayName(profile: OrganizationUserProfileDbRow | undefined) {
    const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();

    return fullName || profile?.name || profile?.email?.split("@")[0] || "Utilisateur";
}

function getInitials(name: string, email: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);

    return (initials || email.slice(0, 2) || "UT").toUpperCase();
}

function getMemberStatus(status: string | null): OrganizationMemberStatus {
    return isOrganizationMemberStatus(status) ? status : ORGANIZATION_MEMBER_STATUS.invited;
}

export function filterOrganizationRosterMemberships(memberships: OrganizationMembershipDbRow[]) {
    return memberships.filter((membership) => membership.status !== ORGANIZATION_MEMBER_STATUS.removed);
}

export function mapOrganizationUserRows(
    memberships: OrganizationMembershipDbRow[],
    profiles: OrganizationUserProfileDbRow[],
    assignmentCountsByUserId: ReadonlyMap<string, OrganizationUserAssignmentCounts> = new Map(),
): OrganizationUserRow[] {
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return memberships
        .flatMap((membership) => {
            if (!membership.user_id) {
                return [];
            }

            const profile = profilesById.get(membership.user_id);
            const email = profile?.email ?? "";
            const name = getDisplayName(profile);
            const role = isOrganizationMemberRole(membership.role)
                ? getOrganizationMemberRoleLabel(membership.role)
                : getOrganizationMemberRoleLabel(ORGANIZATION_MEMBER_ROLE.member);
            const assignmentCounts = assignmentCountsByUserId.get(membership.user_id);

            return [{
                email,
                id: membership.user_id,
                initials: getInitials(name, email),
                name,
                quizCount: assignmentCounts?.quizCount ?? 0,
                role,
                roleplayCount: assignmentCounts?.roleplayCount ?? 0,
                status: getMemberStatus(membership.status),
            }];
        })
        .sort((firstUser, secondUser) => firstUser.name.localeCompare(secondUser.name, "fr-FR"));
}

export async function listOrganizationUsers(organizationId: string): Promise<OrganizationUserRow[]> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .maybeSingle<OrganizationExistsRow>();

    if (organizationError) {
        throw organizationError;
    }

    if (!organization) {
        throw new NotFoundError("Organisation introuvable.");
    }

    const { data: memberships, error: membershipsError } = await supabase
        .from("organization_members")
        .select("user_id, role, status")
        .eq("organization_id", organizationId)
        .returns<OrganizationMembershipDbRow[]>();

    if (membershipsError) {
        throw membershipsError;
    }

    const rosterMemberships = filterOrganizationRosterMemberships(memberships ?? []);
    const userIds = uniqueValues(rosterMemberships.map((membership) => membership.user_id));

    if (userIds.length === 0) {
        return [];
    }

    const [profilesResult, assignmentCountsByUserId] = await Promise.all([
        supabase
            .from("profiles")
            .select("id, email, name, first_name, last_name")
            .in("id", userIds)
            .returns<OrganizationUserProfileDbRow[]>(),
        listOrganizationUserAssignmentCounts(supabase, {
            kind: "organization",
            organizationId,
            userIds,
        }),
    ]);

    if (profilesResult.error) {
        throw profilesResult.error;
    }

    return mapOrganizationUserRows(rosterMemberships, profilesResult.data ?? [], assignmentCountsByUserId);
}
