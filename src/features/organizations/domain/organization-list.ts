export const ORGANIZATION_STATUS = {
    active: "active",
    suspended: "suspended",
} as const;

export const ORGANIZATION_STATUSES = [ORGANIZATION_STATUS.active, ORGANIZATION_STATUS.suspended] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
    [ORGANIZATION_STATUS.active]: "Actif",
    [ORGANIZATION_STATUS.suspended]: "Suspendu",
};

export const organizationStatusOptions = ORGANIZATION_STATUSES.map((status) => ({
    label: ORGANIZATION_STATUS_LABELS[status],
    value: status,
}));

export function getOrganizationStatusLabel(status: OrganizationStatus) {
    return ORGANIZATION_STATUS_LABELS[status];
}

export interface OrganizationListItem {
    createdAt: string;
    groupCount: number;
    id: string;
    name: string;
    quizCount: number;
    roleplayCount: number;
    status: OrganizationStatus;
    userCount: number;
}
