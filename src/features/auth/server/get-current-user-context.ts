import { createClient } from "@/lib/supabase/server";
import {
    isOrganizationRole,
    isPlatformRole,
    type OrganizationMembershipContext,
    type UserContext,
} from "@/features/auth/domain/user-context";

interface ProfileRow {
    email: string | null;
    platform_role: string | null;
}

interface OrganizationMemberRow {
    organization_id: string | null;
    role: string | null;
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
        .select("organization_id, role")
        .eq("user_id", user.id)
        .returns<OrganizationMemberRow[]>();

    const memberships: OrganizationMembershipContext[] = (membershipRows ?? []).flatMap((membership) => {
        if (!membership.organization_id || !isOrganizationRole(membership.role)) {
            return [];
        }

        return [
            {
                organizationId: membership.organization_id,
                role: membership.role,
            },
        ];
    });

    const activeMembership = memberships[0] ?? null;

    return {
        activeOrganizationId: activeMembership?.organizationId ?? null,
        activeOrganizationRole: activeMembership?.role ?? null,
        email: profile?.email ?? user.email ?? "",
        memberships,
        platformRole: isPlatformRole(profile?.platform_role) ? profile.platform_role : "user",
        userId: user.id,
    };
}
