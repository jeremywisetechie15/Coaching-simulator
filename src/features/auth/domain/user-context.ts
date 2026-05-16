import type {
    OrganizationMemberRole,
    OrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";
import {
    isOrganizationMemberRole,
    isOrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";

export type PlatformRole = "admin" | "user";
export type OrganizationRole = OrganizationMemberRole;

export interface OrganizationMembershipContext {
    organizationId: string;
    role: OrganizationRole;
    status: OrganizationMemberStatus;
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
    return isOrganizationMemberRole(value);
}

export function isOrganizationMembershipStatus(value: unknown): value is OrganizationMemberStatus {
    return isOrganizationMemberStatus(value);
}
