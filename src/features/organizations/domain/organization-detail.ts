import type { OrganizationStatus } from "./organization-list";
import type { OrganizationMemberStatus } from "./organization-member";

export type OrganizationActivityStatus = "not_started" | "in_progress" | "completed";

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
    description?: string;
    id: string;
    memberCount: number;
    name: string;
    quizCount: number;
    roleplayCount: number;
    status?: "active" | "archived";
}

export interface OrganizationUserRow {
    email: string;
    id: string;
    initials: string;
    name: string;
    quizCount: number;
    role: string;
    roleplayCount: number;
    status: OrganizationMemberStatus;
}

export interface OrganizationRoleplayRow {
    assignedAt: string;
    groupName: string;
    id: string;
    learnerCount: number;
    persona: string;
    status: OrganizationActivityStatus;
    title: string;
}

export interface OrganizationEvaluationRow {
    assignedAt: string;
    groupName: string;
    id: string;
    learnerCount: number;
    status: OrganizationActivityStatus;
    title: string;
    type: string;
}

export const demoOrganizationGroups: OrganizationGroupRow[] = [
    { id: "sales", memberCount: 2, name: "Sales", quizCount: 2, roleplayCount: 3 },
    { id: "marketing", memberCount: 2, name: "Marketing", quizCount: 3, roleplayCount: 4 },
    { id: "direction", memberCount: 2, name: "Direction", quizCount: 1, roleplayCount: 2 },
];

export const demoOrganizationUsers: OrganizationUserRow[] = [
    {
        email: "paul.laverdure@deepmark.fr",
        id: "paul-laverdure",
        initials: "PL",
        name: "Paul Laverdure",
        quizCount: 4,
        role: "SuperAdmin",
        roleplayCount: 5,
        status: "active",
    },
    {
        email: "thomas.bernard@deepmark.fr",
        id: "thomas-bernard",
        initials: "TB",
        name: "Thomas Bernard",
        quizCount: 2,
        role: "Learner",
        roleplayCount: 3,
        status: "active",
    },
];

export const demoOrganizationRoleplays: OrganizationRoleplayRow[] = [
    {
        assignedAt: "15 mars 2024",
        groupName: "Sales",
        id: "qualifier-besoin",
        learnerCount: 3,
        persona: "Thomas Lion",
        status: "not_started",
        title: "Qualifier un besoin de formation",
    },
    {
        assignedAt: "20 mars 2024",
        groupName: "Marketing",
        id: "premier-rdv",
        learnerCount: 2,
        persona: "Rachid HAMRANI",
        status: "not_started",
        title: "Décrocher un premier rendez-vous",
    },
    {
        assignedAt: "1 février 2024",
        groupName: "Sales",
        id: "conclure-negociation",
        learnerCount: 2,
        persona: "Sophie Martin",
        status: "in_progress",
        title: "Conclure une négociation commerciale",
    },
    {
        assignedAt: "10 février 2024",
        groupName: "Marketing",
        id: "demonstration-produit",
        learnerCount: 3,
        persona: "Marc Dubois",
        status: "in_progress",
        title: "Convaincre avec une démonstration produit",
    },
    {
        assignedAt: "10 janvier 2024",
        groupName: "RH",
        id: "recadrer-collaborateur",
        learnerCount: 2,
        persona: "Claude SAVARY",
        status: "completed",
        title: "Recadrer et remobiliser un collaborateur",
    },
];

export const demoOrganizationEvaluations: OrganizationEvaluationRow[] = [
    {
        assignedAt: "10 mars 2024",
        groupName: "Marketing",
        id: "quiz-deepmark",
        learnerCount: 2,
        status: "not_started",
        title: "Quiz - DEEPMARK",
        type: "Quiz de Connaissance",
    },
    {
        assignedAt: "18 mars 2024",
        groupName: "Sales",
        id: "decouverte-besoins",
        learnerCount: 3,
        status: "not_started",
        title: "Découverte des besoins",
        type: "Quiz d'Auto-Positionnement",
    },
    {
        assignedAt: "15 février 2024",
        groupName: "Sales",
        id: "entretien-commercial",
        learnerCount: 2,
        status: "in_progress",
        title: "Entretien Commercial",
        type: "Quiz de Connaissance",
    },
    {
        assignedAt: "20 février 2024",
        groupName: "Marketing",
        id: "techniques-closing",
        learnerCount: 3,
        status: "in_progress",
        title: "Techniques de closing",
        type: "Quiz d'Auto-Positionnement",
    },
    {
        assignedAt: "15 janvier 2024",
        groupName: "Sales",
        id: "prise-rendez-vous",
        learnerCount: 2,
        status: "completed",
        title: "Prise de rendez-vous",
        type: "Quiz de Connaissance",
    },
];
