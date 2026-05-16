import type { OrganizationRole, UserContext } from "@/features/auth/domain/user-context";
import { isActiveOrganizationMember } from "./organization-member";

export function hasOrganizationAccess(context: UserContext, organizationId: string) {
    if (context.platformRole === "admin") {
        return true;
    }

    return context.memberships.some(
        (membership) => membership.organizationId === organizationId && isActiveOrganizationMember(membership.status)
    );
}

export function getOrganizationRole(context: UserContext, organizationId: string): OrganizationRole | null {
    return (
        context.memberships.find(
            (membership) => membership.organizationId === organizationId && isActiveOrganizationMember(membership.status)
        )?.role ?? null
    );
}

export function canManageOrganization(context: UserContext, organizationId: string) {
    if (context.platformRole === "admin") {
        return true;
    }

    return getOrganizationRole(context, organizationId) === "manager";
}
