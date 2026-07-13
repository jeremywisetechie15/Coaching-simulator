import type { User } from "@supabase/supabase-js";
import { requireAdmin } from "@/features/auth/server";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import {
    getUserRoleUpdateDecision,
    PLATFORM_ROLE,
    type PlatformRole,
} from "@/features/users/domain";
import type { UpdateUserDto } from "@/features/users/dto";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserById } from "./get-user-by-id";

interface ProfileRow {
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
    platform_role: string | null;
}

interface MembershipRow {
    id: string;
    role: string;
    status: string;
}

function getTargetPlatformRole(profile: ProfileRow): PlatformRole {
    return profile.platform_role === PLATFORM_ROLE.admin ? PLATFORM_ROLE.admin : PLATFORM_ROLE.user;
}

async function restoreAuthUser(userId: string, user: User) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: user.user_metadata,
    });

    if (error) console.error("Failed to roll back auth user update", error);
}

export async function updateUser(userId: string, input: UpdateUserDto) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const [profileResult, authUserResult, membershipsResult] = await Promise.all([
        adminSupabase
            .from("profiles")
            .select("id, name, first_name, last_name, platform_role")
            .eq("id", userId)
            .maybeSingle<ProfileRow>(),
        adminSupabase.auth.admin.getUserById(userId),
        adminSupabase
            .from("organization_members")
            .select("id, role, status")
            .eq("user_id", userId)
            .returns<MembershipRow[]>(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    if (authUserResult.error || !authUserResult.data.user || !profileResult.data) {
        throw new NotFoundError("Utilisateur introuvable.");
    }

    const profile = profileResult.data;
    const authUser = authUserResult.data.user;
    const roleDecision = getUserRoleUpdateDecision(getTargetPlatformRole(profile), input.role);

    if (!roleDecision.allowed) throw new ForbiddenError(roleDecision.reason ?? undefined);

    const manageableMemberships = (membershipsResult.data ?? []).filter(
        (membership) => membership.status !== ORGANIZATION_MEMBER_STATUS.removed,
    );

    if (roleDecision.organizationRole === "manager" && manageableMemberships.length === 0) {
        throw new ConflictError("Un utilisateur doit appartenir à une organisation pour devenir Manager.");
    }

    const displayName = `${input.firstName} ${input.lastName}`.trim();
    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
            ...authUser.user_metadata,
            first_name: input.firstName,
            last_name: input.lastName,
            name: displayName,
        },
    });

    if (authUpdateError) throw authUpdateError;

    const { error: profileUpdateError } = await adminSupabase
        .from("profiles")
        .update({
            first_name: input.firstName,
            last_name: input.lastName,
            name: displayName,
            updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

    if (profileUpdateError) {
        await restoreAuthUser(userId, authUser);
        throw profileUpdateError;
    }

    if (roleDecision.organizationRole && manageableMemberships.length > 0) {
        const membershipIds = manageableMemberships.map((membership) => membership.id);
        const { error: membershipUpdateError } = await adminSupabase
            .from("organization_members")
            .update({ role: roleDecision.organizationRole })
            .in("id", membershipIds);

        if (membershipUpdateError) {
            await Promise.all([
                restoreAuthUser(userId, authUser),
                adminSupabase.from("profiles").update({
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    name: profile.name,
                }).eq("id", userId),
            ]);
            throw membershipUpdateError;
        }
    }

    const updatedUser = await getUserById(userId);
    if (!updatedUser) throw new NotFoundError("Utilisateur introuvable.");
    return updatedUser;
}
