import { requireAdmin } from "@/features/auth/server";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import {
    getUserStatusManagementDecision,
    PLATFORM_ROLE,
    USER_STATUS_ACTION,
} from "@/features/users/domain";
import type { UpdateUserStatusDto } from "@/features/users/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";

const USER_BAN_DURATION = "876000h";

interface ProfileRoleRow {
    platform_role: string | null;
}

interface MembershipStatusRow {
    id: string;
    status: string | null;
}

export async function updateUserStatus(userId: string, input: UpdateUserStatusDto) {
    const actor = await requireAdmin();
    const adminSupabase = createAdminClient();
    const [profileResult, authUserResult, membershipsResult] = await Promise.all([
        adminSupabase
            .from("profiles")
            .select("platform_role")
            .eq("id", userId)
            .maybeSingle<ProfileRoleRow>(),
        adminSupabase.auth.admin.getUserById(userId),
        adminSupabase
            .from("organization_members")
            .select("id, status")
            .eq("user_id", userId)
            .returns<MembershipStatusRow[]>(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    if (authUserResult.error || !authUserResult.data.user) {
        throw new NotFoundError("Utilisateur introuvable.");
    }

    const targetPlatformRole =
        profileResult.data?.platform_role === PLATFORM_ROLE.admin ? PLATFORM_ROLE.admin : PLATFORM_ROLE.user;
    const decision = getUserStatusManagementDecision({
        actorUserId: actor.userId,
        targetPlatformRole,
        targetUserId: userId,
    });

    if (!decision.allowed) {
        throw new ForbiddenError(decision.reason ?? undefined);
    }

    const isSuspension = input.action === USER_STATUS_ACTION.suspend;
    const sourceStatus = isSuspension
        ? ORGANIZATION_MEMBER_STATUS.active
        : ORGANIZATION_MEMBER_STATUS.suspended;
    const destinationStatus = isSuspension
        ? ORGANIZATION_MEMBER_STATUS.suspended
        : ORGANIZATION_MEMBER_STATUS.active;
    const membershipIds = (membershipsResult.data ?? [])
        .filter((membership) => membership.status === sourceStatus)
        .map((membership) => membership.id);

    if (membershipIds.length === 0) {
        throw new ConflictError(
            isSuspension
                ? "Seul un utilisateur actif peut être suspendu."
                : "Aucune suspension active n’a été trouvée pour cet utilisateur.",
        );
    }

    const { error: membershipUpdateError } = await adminSupabase
        .from("organization_members")
        .update({ status: destinationStatus })
        .in("id", membershipIds);

    if (membershipUpdateError) throw membershipUpdateError;

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(userId, {
        ban_duration: isSuspension ? USER_BAN_DURATION : "none",
    });

    if (authUpdateError) {
        await adminSupabase
            .from("organization_members")
            .update({ status: sourceStatus })
            .in("id", membershipIds);
        throw authUpdateError;
    }

    return {
        isSuspended: isSuspension,
        status: isSuspension ? "inactive" as const : "active" as const,
    };
}
