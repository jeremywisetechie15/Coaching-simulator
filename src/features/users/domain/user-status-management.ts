import { PLATFORM_ROLE, type PlatformRole, type UserStatus } from "./users";

export const USER_STATUS_ACTION = {
    reactivate: "reactivate",
    suspend: "suspend",
} as const;

export type UserStatusAction = (typeof USER_STATUS_ACTION)[keyof typeof USER_STATUS_ACTION];

export const USER_STATUS_ACTION_LABELS: Record<UserStatusAction, string> = {
    [USER_STATUS_ACTION.reactivate]: "Réactiver",
    [USER_STATUS_ACTION.suspend]: "Suspendre",
};

export interface UserStatusManagementDecision {
    allowed: boolean;
    reason: string | null;
}

export function canManageUserStatusTarget(targetPlatformRole: PlatformRole) {
    return targetPlatformRole !== PLATFORM_ROLE.admin;
}

export function getUserStatusManagementDecision({
    actorUserId,
    targetPlatformRole,
    targetUserId,
}: {
    actorUserId: string;
    targetPlatformRole: PlatformRole;
    targetUserId: string;
}): UserStatusManagementDecision {
    if (actorUserId === targetUserId) {
        return { allowed: false, reason: "Vous ne pouvez pas modifier votre propre statut." };
    }

    if (!canManageUserStatusTarget(targetPlatformRole)) {
        return { allowed: false, reason: "Le statut d’un administrateur se gère depuis Supabase." };
    }

    return { allowed: true, reason: null };
}

export function getAvailableUserStatusAction({
    isSuspended,
    status,
    targetPlatformRole,
}: {
    isSuspended: boolean;
    status: UserStatus;
    targetPlatformRole: PlatformRole;
}): UserStatusAction | null {
    if (!canManageUserStatusTarget(targetPlatformRole)) return null;
    if (status === "active") return USER_STATUS_ACTION.suspend;
    if (status === "inactive" && isSuspended) return USER_STATUS_ACTION.reactivate;
    return null;
}
