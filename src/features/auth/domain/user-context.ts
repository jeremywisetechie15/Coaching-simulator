export type PlatformRole = "admin" | "user";
export type OrganizationRole = "member" | "manager";

export interface OrganizationMembershipContext {
    organizationId: string;
    role: OrganizationRole;
}

export interface UserContext {
    activeOrganizationId: string | null;
    activeOrganizationRole: OrganizationRole | null;
    email: string;
    memberships: OrganizationMembershipContext[];
    platformRole: PlatformRole;
    userId: string;
}

export function isPlatformRole(value: unknown): value is PlatformRole {
    return value === "admin" || value === "user";
}

export function isOrganizationRole(value: unknown): value is OrganizationRole {
    return value === "member" || value === "manager";
}
