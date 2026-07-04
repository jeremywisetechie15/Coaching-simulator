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
    createdAt?: string;
    description?: string;
    id: string;
    memberCount: number;
    name: string;
    quizCount: number;
    roleplayCount: number;
    status?: "active" | "archived";
}

export interface OrganizationGroupDetail extends OrganizationGroupRow {
    organizationId: string;
    organizationName: string;
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

