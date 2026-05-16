import type { OrganizationStatus } from "./organization-list";
import type { OrganizationMemberStatus } from "./organization-member";

export interface OrganizationDetail {
    contactEmail: string;
    createdAt: string;
    groupCount: number;
    id: string;
    industry: string;
    name: string;
    phone: string;
    programCount: number;
    region: string;
    status: OrganizationStatus;
    userCount: number;
}

export interface OrganizationGroupRow {
    formationCount: number;
    id: string;
    memberCount: number;
    name: string;
    progress: number;
}

export interface OrganizationUserRow {
    email: string;
    formationCount: number;
    id: string;
    initials: string;
    name: string;
    progress: number;
    role: string;
    status: OrganizationMemberStatus;
}

export interface OrganizationTrainingRow {
    assignedAt: string;
    groupName: string;
    id: string;
    learnerCount: number;
    progress: number;
    status: "not_started" | "in_progress" | "completed";
    title: string;
}

export const demoOrganizationGroups: OrganizationGroupRow[] = [
    { formationCount: 3, id: "sales", memberCount: 2, name: "Sales", progress: 65 },
    { formationCount: 4, id: "marketing", memberCount: 2, name: "Marketing", progress: 48 },
    { formationCount: 2, id: "direction", memberCount: 2, name: "Direction", progress: 82 },
];

export const demoOrganizationUsers: OrganizationUserRow[] = [
    {
        email: "paul.laverdure@deepmark.fr",
        formationCount: 4,
        id: "paul-laverdure",
        initials: "PL",
        name: "Paul Laverdure",
        progress: 67,
        role: "SuperAdmin",
        status: "active",
    },
    {
        email: "thomas.bernard@deepmark.fr",
        formationCount: 3,
        id: "thomas-bernard",
        initials: "TB",
        name: "Thomas Bernard",
        progress: 52,
        role: "Learner",
        status: "active",
    },
];

export const demoOrganizationTrainings: OrganizationTrainingRow[] = [
    {
        assignedAt: "10 mars 2024",
        groupName: "Sales",
        id: "objections",
        learnerCount: 2,
        progress: 0,
        status: "not_started",
        title: "Gestion des objections",
    },
    {
        assignedAt: "12 mars 2024",
        groupName: "Marketing",
        id: "closing",
        learnerCount: 3,
        progress: 0,
        status: "not_started",
        title: "Techniques de closing",
    },
    {
        assignedAt: "1 février 2024",
        groupName: "Sales",
        id: "prospect-meeting",
        learnerCount: 2,
        progress: 65,
        status: "in_progress",
        title: "Prise de rendez-vous prospect",
    },
    {
        assignedAt: "15 février 2024",
        groupName: "Marketing",
        id: "persuasive-communication",
        learnerCount: 3,
        progress: 40,
        status: "in_progress",
        title: "Communication persuasive",
    },
    {
        assignedAt: "15 janvier 2024",
        groupName: "Sales",
        id: "intro-sales",
        learnerCount: 2,
        progress: 100,
        status: "completed",
        title: "Introduction à la vente",
    },
];
