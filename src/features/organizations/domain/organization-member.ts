export const ORGANIZATION_MEMBER_ROLES = ["member", "manager"] as const;

export type OrganizationMemberRole = typeof ORGANIZATION_MEMBER_ROLES[number];

export const ORGANIZATION_MEMBER_STATUSES = ["invited", "active", "suspended", "removed"] as const;

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

export function isOrganizationMemberStatus(value: unknown): value is OrganizationMemberStatus {
    return ORGANIZATION_MEMBER_STATUSES.includes(value as OrganizationMemberStatus);
}

export function isActiveOrganizationMember(status: OrganizationMemberStatus) {
    return status === "active";
}
