import { ORGANIZATION_STATUS, type OrganizationStatus } from "./organization-list";

export const ORGANIZATION_MEMBER_ROLE = {
    manager: "manager",
    member: "member",
} as const;

export const ORGANIZATION_MEMBER_ROLES = [
    ORGANIZATION_MEMBER_ROLE.member,
    ORGANIZATION_MEMBER_ROLE.manager,
] as const;

export type OrganizationMemberRole = typeof ORGANIZATION_MEMBER_ROLES[number];

export const ORGANIZATION_MEMBER_ROLE_LABELS: Record<OrganizationMemberRole, string> = {
    manager: "Manager",
    member: "Learner",
};

export const organizationMemberRoleOptions = ORGANIZATION_MEMBER_ROLES.map((role) => ({
    label: ORGANIZATION_MEMBER_ROLE_LABELS[role],
    value: role,
}));

export const ORGANIZATION_MEMBER_STATUS = {
    active: "active",
    invited: "invited",
    removed: "removed",
    suspended: "suspended",
} as const;

export const ORGANIZATION_MEMBER_STATUSES = [
    ORGANIZATION_MEMBER_STATUS.invited,
    ORGANIZATION_MEMBER_STATUS.active,
    ORGANIZATION_MEMBER_STATUS.suspended,
    ORGANIZATION_MEMBER_STATUS.removed,
] as const;

export type OrganizationMemberStatus = typeof ORGANIZATION_MEMBER_STATUSES[number];

export const ORGANIZATION_MEMBER_STATUS_LABELS: Record<OrganizationMemberStatus, string> = {
    active: "Actif",
    invited: "Invité",
    removed: "Retiré",
    suspended: "Suspendu",
};

export function isOrganizationMemberRole(value: unknown): value is OrganizationMemberRole {
    return ORGANIZATION_MEMBER_ROLES.includes(value as OrganizationMemberRole);
}

export function getOrganizationMemberRoleLabel(role: OrganizationMemberRole) {
    return ORGANIZATION_MEMBER_ROLE_LABELS[role];
}

export function isOrganizationMemberStatus(value: unknown): value is OrganizationMemberStatus {
    return ORGANIZATION_MEMBER_STATUSES.includes(value as OrganizationMemberStatus);
}

export function isActiveOrganizationMember(status: OrganizationMemberStatus) {
    return status === ORGANIZATION_MEMBER_STATUS.active;
}

export function getEffectiveOrganizationMemberStatus(
    memberStatus: OrganizationMemberStatus,
    organizationStatus: OrganizationStatus,
): OrganizationMemberStatus {
    if (
        memberStatus === ORGANIZATION_MEMBER_STATUS.active &&
        organizationStatus === ORGANIZATION_STATUS.suspended
    ) {
        return ORGANIZATION_MEMBER_STATUS.suspended;
    }

    return memberStatus;
}
