export const ORGANIZATION_STATUS = {
    active: "active",
    suspended: "suspended",
} as const;

export const ORGANIZATION_STATUSES = [ORGANIZATION_STATUS.active, ORGANIZATION_STATUS.suspended] as const;

export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const ORGANIZATION_STATUS_LABELS: Record<OrganizationStatus, string> = {
    [ORGANIZATION_STATUS.active]: "Actif",
    [ORGANIZATION_STATUS.suspended]: "Désactivé",
};

export const organizationStatusOptions = ORGANIZATION_STATUSES.map((status) => ({
    label: ORGANIZATION_STATUS_LABELS[status],
    value: status,
}));

export const ORGANIZATION_STATUS_FILTER_ALL = "all" as const;

export type OrganizationStatusFilter = typeof ORGANIZATION_STATUS_FILTER_ALL | OrganizationStatus;

export const ORGANIZATION_STATUS_FILTER_OPTIONS = [
    { label: "Tous statuts", value: ORGANIZATION_STATUS_FILTER_ALL },
    ...organizationStatusOptions,
] as const;

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

export function filterOrganizationListItems(
    organizations: readonly OrganizationListItem[],
    query: string,
    statusFilter: OrganizationStatusFilter,
) {
    const normalizedQuery = query.trim().toLocaleLowerCase("fr-FR");

    return organizations.filter((organization) => {
        const matchesQuery = !normalizedQuery
            || organization.name.toLocaleLowerCase("fr-FR").includes(normalizedQuery);
        const matchesStatus = statusFilter === ORGANIZATION_STATUS_FILTER_ALL
            || organization.status === statusFilter;

        return matchesQuery && matchesStatus;
    });
}
