import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    getOrganizationUserDisplayName,
    type OrganizationUserProfileDbRow,
} from "./list-organization-users";

interface OrganizationMemberIdRow {
    user_id: string | null;
}

export async function listOrganizationMemberNames(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
) {
    const membershipsResult = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", organizationId)
        .neq("status", ORGANIZATION_MEMBER_STATUS.removed)
        .returns<OrganizationMemberIdRow[]>();

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    const userIds = Array.from(new Set(
        (membershipsResult.data ?? []).flatMap((membership) =>
            membership.user_id ? [membership.user_id] : [],
        ),
    ));

    if (userIds.length === 0) {
        return [];
    }

    const profilesResult = await supabase
        .from("profiles")
        .select("id, email, name, first_name, last_name")
        .in("id", userIds)
        .returns<OrganizationUserProfileDbRow[]>();

    if (profilesResult.error) {
        throw profilesResult.error;
    }

    const profilesById = new Map(
        (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
    );

    return userIds
        .map((userId) => getOrganizationUserDisplayName(profilesById.get(userId)))
        .sort((first, second) => first.localeCompare(second, "fr-FR"));
}
