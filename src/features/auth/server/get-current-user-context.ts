import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    isOrganizationRole,
    isOrganizationMembershipStatus,
    isPlatformRole,
    type OrganizationMembershipContext,
    type UserContext,
} from "@/features/auth/domain/user-context";
import {
    getEffectiveOrganizationMemberStatus,
    ORGANIZATION_MEMBER_STATUS,
} from "@/features/organizations/domain/organization-member";
import {
    ORGANIZATION_STATUS,
    type OrganizationStatus,
} from "@/features/organizations/domain/organization-list";
import { PLATFORM_ROLE } from "@/features/users/domain/users";

interface ProfileRow {
    email: string | null;
    platform_role: string | null;
}

interface OrganizationMemberRow {
    organization_id: string | null;
    role: string | null;
    status: string | null;
}

interface OrganizationStatusRow {
    id: string;
    status: OrganizationStatus;
}

export async function getCurrentUserContext(): Promise<UserContext | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return null;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("email, platform_role")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

    const { data: membershipRows } = await supabase
        .from("organization_members")
        .select("organization_id, role, status")
        .eq("user_id", user.id)
        .returns<OrganizationMemberRow[]>();

    const organizationIds = Array.from(new Set(
        (membershipRows ?? [])
            .map((membership) => membership.organization_id)
            .filter((organizationId): organizationId is string => Boolean(organizationId)),
    ));
    const organizationStatusResult = organizationIds.length > 0
        ? await createAdminClient()
              .from("organizations")
              .select("id, status")
              .in("id", organizationIds)
              .returns<OrganizationStatusRow[]>()
        : { data: [] as OrganizationStatusRow[], error: null };

    if (organizationStatusResult.error) {
        throw organizationStatusResult.error;
    }

    const organizationStatusById = new Map(
        (organizationStatusResult.data ?? []).map((organization) => [organization.id, organization.status]),
    );
    const memberships: OrganizationMembershipContext[] = (membershipRows ?? []).flatMap((membership) => {
        if (
            !membership.organization_id ||
            !isOrganizationRole(membership.role) ||
            !isOrganizationMembershipStatus(membership.status) ||
            !organizationStatusById.has(membership.organization_id)
        ) {
            return [];
        }

        const organizationStatus = organizationStatusById.get(membership.organization_id) ?? ORGANIZATION_STATUS.suspended;

        return [
            {
                organizationId: membership.organization_id,
                role: membership.role,
                status: getEffectiveOrganizationMemberStatus(membership.status, organizationStatus),
            },
        ];
    });

    const activeMembership =
        memberships.find((membership) => membership.status === ORGANIZATION_MEMBER_STATUS.active) ?? null;

    return {
        activeOrganizationId: activeMembership?.organizationId ?? null,
        activeOrganizationRole: activeMembership?.role ?? null,
        email: profile?.email ?? user.email ?? "",
        memberships,
        platformRole: isPlatformRole(profile?.platform_role) ? profile.platform_role : PLATFORM_ROLE.user,
        userId: user.id,
    };
}
