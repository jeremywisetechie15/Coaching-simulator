export const PLATFORM_ROLE = {
    admin: "admin",
    user: "user",
} as const;

export const PLATFORM_ROLES = [PLATFORM_ROLE.admin, PLATFORM_ROLE.user] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const USER_STATUS = {
    active: "active",
    inactive: "inactive",
    pending: "pending",
} as const;

export const USER_STATUSES = [USER_STATUS.active, USER_STATUS.inactive, USER_STATUS.pending] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
    [USER_STATUS.active]: "Activé",
    [USER_STATUS.inactive]: "Désactivé",
    [USER_STATUS.pending]: "En attente",
};

export const USER_STATUS_FILTER_OPTIONS = [
    { label: "Tous statuts", value: "all" },
    { label: "Actifs", value: USER_STATUS.active },
    { label: USER_STATUS_LABELS.pending, value: USER_STATUS.pending },
    { label: "Inactifs", value: USER_STATUS.inactive },
] as const;

export const USER_ROLE = {
    admin: "Admin",
    learner: "Learner",
    manager: "Manager",
} as const;

export const USER_ROLES = [USER_ROLE.admin, USER_ROLE.manager, USER_ROLE.learner] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
    [USER_ROLE.admin]: "Admin",
    [USER_ROLE.learner]: "Learner",
    [USER_ROLE.manager]: "Manager",
};

export const USER_ROLE_OPTIONS = USER_ROLES.map((role) => ({
    label: USER_ROLE_LABELS[role],
    value: role,
}));

export const USER_ROLE_FILTER_OPTIONS = [
    { label: "Tous rôles", value: "all" },
    ...USER_ROLE_OPTIONS,
] as const;

export function getUserStatusLabel(status: UserStatus) {
    return USER_STATUS_LABELS[status];
}

export function getUserRoleLabel(role: UserRole) {
    return USER_ROLE_LABELS[role];
}

export interface UserTraining {
    assignedAt: string;
    id: string;
    progress: number;
    status: "not_started" | "in_progress" | "completed";
    title: string;
}

export interface UserRoleplay {
    date: string;
    duration: string;
    id: string;
    persona: string;
    score: number;
    scenario: string;
    type: string;
}

export type UserAssignmentStatus = "not_started" | "in_progress" | "completed";

export interface UserAssignedRoleplay {
    assignedAt: string;
    id: string;
    index: number | null;
    persona: string;
    sessions: number;
    status: UserAssignmentStatus;
    title: string;
}

export interface UserAssignedQuiz {
    assignedAt: string;
    attempts: number;
    id: string;
    score: number | null;
    status: UserAssignmentStatus;
    title: string;
    type: string;
}

export interface UserSkillStatistic {
    label: string;
    score: number;
}

export type UserSkillDimensionKey = "savoir" | "savoir_faire" | "savoir_etre";

export interface UserSkillDimensionProgress {
    itemCount: number;
    key: UserSkillDimensionKey;
    label: string;
    score: number | null;
}

export interface UserSkillDimensionItemProgress {
    dimension: UserSkillDimensionKey;
    id: string;
    label: string;
    score: number | null;
}

export interface UserSkillProgress {
    delta: number | null;
    dimensions: UserSkillDimensionProgress[];
    id: string;
    initialScore: number | null;
    items: UserSkillDimensionItemProgress[];
    label: string;
    score: number | null;
}

export interface UserStatistics {
    averageQuizScore: string;
    averageRoleplayScore: string;
    bestRoleplayScore: string;
    completedQuizzes: string;
    completedRoleplays: string;
    completionRate: string;
    lastActivity: string;
    latestRoleplayScore: string;
    quizVsRoleplayGap: string;
    roleplayProgressLast30Days: string;
    roleplayProgressSinceFirst: string;
    targetScore: string;
    targetScoreGap: string;
    topMasteredSkills: UserSkillStatistic[];
    topSkillsToImprove: UserSkillStatistic[];
    trainingTime: string;
}

export interface UserSkill {
    id: string;
    label: string;
    level: "Faible" | "À renforcer" | "En progression" | "Maîtrisée";
    score: number;
}

export interface UserActivity {
    date: string;
    id: string;
    label: string;
    type: string;
}

export interface UserListItem {
    city: string;
    email: string;
    group: string;
    id: string;
    initials: string;
    isSuspended: boolean;
    joinedAt: string;
    lastActiveAt: string;
    name: string;
    organization: string;
    phone: string;
    platformRole: PlatformRole;
    progress: number;
    role: UserRole;
    status: UserStatus;
    trainings: UserTraining[];
    roleplays: UserRoleplay[];
    skills: UserSkill[];
    activity: UserActivity[];
}
