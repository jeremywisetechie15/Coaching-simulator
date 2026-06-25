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

export const demoOrganizations: OrganizationListItem[] = [
    {
        createdAt: "15/06/2023",
        groupCount: 3,
        id: "deepmark",
        name: "Deepmark",
        quizCount: 4,
        roleplayCount: 5,
        status: "active",
        userCount: 2,
    },
    {
        createdAt: "10/01/2024",
        groupCount: 2,
        id: "tech-corp",
        name: "Tech Corp",
        quizCount: 2,
        roleplayCount: 3,
        status: "active",
        userCount: 8,
    },
    {
        createdAt: "20/11/2023",
        groupCount: 4,
        id: "innovate-sas",
        name: "Innovate SAS",
        quizCount: 4,
        roleplayCount: 7,
        status: "active",
        userCount: 12,
    },
    {
        createdAt: "05/08/2023",
        groupCount: 1,
        id: "digital-france",
        name: "Digital France",
        quizCount: 1,
        roleplayCount: 2,
        status: "suspended",
        userCount: 5,
    },
    {
        createdAt: "01/02/2024",
        groupCount: 5,
        id: "sales-academy",
        name: "Sales Academy",
        quizCount: 6,
        roleplayCount: 10,
        status: "active",
        userCount: 20,
    },
];
