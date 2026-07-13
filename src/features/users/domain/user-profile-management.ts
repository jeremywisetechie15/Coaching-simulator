import {
    ORGANIZATION_MEMBER_ROLE,
    type OrganizationMemberRole,
} from "@/features/organizations/domain/organization-member";
import {
    PLATFORM_ROLE,
    type PlatformRole,
    USER_ROLE,
    USER_ROLE_LABELS,
    type UserRole,
} from "./users";

export interface UserRoleUpdateDecision {
    allowed: boolean;
    organizationRole: OrganizationMemberRole | null;
    reason: string | null;
}

export function getEditableUserRoleOptions(targetPlatformRole: PlatformRole) {
    const roles = targetPlatformRole === PLATFORM_ROLE.admin
        ? [USER_ROLE.admin]
        : [USER_ROLE.manager, USER_ROLE.learner];

    return roles.map((role) => ({
        label: USER_ROLE_LABELS[role],
        value: role,
    }));
}

export function getUserRoleUpdateDecision(
    targetPlatformRole: PlatformRole,
    requestedRole: UserRole,
): UserRoleUpdateDecision {
    if (targetPlatformRole === PLATFORM_ROLE.admin) {
        return requestedRole === USER_ROLE.admin
            ? { allowed: true, organizationRole: null, reason: null }
            : {
                allowed: false,
                organizationRole: null,
                reason: "Le rôle plateforme d’un administrateur se gère depuis Supabase.",
            };
    }

    if (requestedRole === USER_ROLE.admin) {
        return {
            allowed: false,
            organizationRole: null,
            reason: "La promotion administrateur se gère depuis Supabase.",
        };
    }

    return {
        allowed: true,
        organizationRole: requestedRole === USER_ROLE.manager
            ? ORGANIZATION_MEMBER_ROLE.manager
            : ORGANIZATION_MEMBER_ROLE.member,
        reason: null,
    };
}
