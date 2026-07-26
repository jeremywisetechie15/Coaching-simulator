import { requireAdmin } from "@/features/auth/server";
import type { OrganizationInvitationResendTarget } from "@/features/organizations/domain/organization-invitation";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { createAdminClient } from "@/lib/supabase/admin";

interface InvitationMembershipRow {
    organization_id: string | null;
}

interface InvitationOrganizationRow {
    id: string;
    name: string;
}

export async function listUserPendingOrganizationInvitations(
    userId: string,
): Promise<OrganizationInvitationResendTarget[]> {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data: memberships, error: membershipsError } = await adminSupabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("status", ORGANIZATION_MEMBER_STATUS.invited)
        .returns<InvitationMembershipRow[]>();

    if (membershipsError) {
        throw membershipsError;
    }

    const organizationIds = Array.from(new Set(
        (memberships ?? [])
            .map((membership) => membership.organization_id)
            .filter((organizationId): organizationId is string => Boolean(organizationId)),
    ));

    if (organizationIds.length === 0) {
        return [];
    }

    const { data: organizations, error: organizationsError } = await adminSupabase
        .from("organizations")
        .select("id, name")
        .in("id", organizationIds)
        .returns<InvitationOrganizationRow[]>();

    if (organizationsError) {
        throw organizationsError;
    }

    const organizationsById = new Map(
        (organizations ?? []).map((organization) => [organization.id, organization.name]),
    );

    return organizationIds
        .flatMap((organizationId) => {
            const organizationName = organizationsById.get(organizationId);

            return organizationName
                ? [{ organizationId, organizationName }]
                : [];
        })
        .sort((first, second) => first.organizationName.localeCompare(second.organizationName, "fr"));
}
