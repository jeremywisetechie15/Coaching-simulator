export const ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE =
    "Ce roleplay possède déjà des sessions. Seuls les champs texte et numériques peuvent être modifiés.";

export interface RoleplaySessionLockedQuiz {
    id: string;
    participation: string;
}

export interface RoleplaySessionLockedResource {
    id: string | null;
    resourceType: string;
    storageBucket: string | null;
    storagePath: string | null;
}

export interface RoleplaySessionLockedConfiguration {
    assignedUserId: string | null;
    backgroundImagePath: string | null;
    category: string | null;
    coachId: string | null;
    difficulty: string | null;
    disc: string;
    domain: string | null;
    groupId: string | null;
    methodId: string | null;
    organizationId: string | null;
    personaId: string | null;
    quizzes: RoleplaySessionLockedQuiz[];
    resources: RoleplaySessionLockedResource[];
    scope: string;
    scorecardId: string | null;
}

export function hasRoleplaySessionLockedConfigurationChanged(
    current: RoleplaySessionLockedConfiguration,
    next: RoleplaySessionLockedConfiguration,
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}
