export type OrganizationStatus = "active" | "suspended";

export interface OrganizationListItem {
    createdAt: string;
    groupCount: number;
    id: string;
    name: string;
    programCount: number;
    status: OrganizationStatus;
    userCount: number;
}

export const demoOrganizations: OrganizationListItem[] = [
    {
        createdAt: "15/06/2023",
        groupCount: 3,
        id: "deepmark",
        name: "Deepmark",
        programCount: 5,
        status: "active",
        userCount: 2,
    },
    {
        createdAt: "10/01/2024",
        groupCount: 2,
        id: "tech-corp",
        name: "Tech Corp",
        programCount: 3,
        status: "active",
        userCount: 8,
    },
    {
        createdAt: "20/11/2023",
        groupCount: 4,
        id: "innovate-sas",
        name: "Innovate SAS",
        programCount: 7,
        status: "active",
        userCount: 12,
    },
    {
        createdAt: "05/08/2023",
        groupCount: 1,
        id: "digital-france",
        name: "Digital France",
        programCount: 2,
        status: "suspended",
        userCount: 5,
    },
    {
        createdAt: "01/02/2024",
        groupCount: 5,
        id: "sales-academy",
        name: "Sales Academy",
        programCount: 10,
        status: "active",
        userCount: 20,
    },
];
