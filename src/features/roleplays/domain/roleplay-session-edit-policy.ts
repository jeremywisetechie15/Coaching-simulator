export const ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE =
    "Ce roleplay possède déjà des sessions. Sa méthode, son persona, son coach, sa scorecard, son audience et ses ressources structurelles sont verrouillés ; ses quiz complémentaires et ses contenus éditoriaux restent modifiables.";

export interface RoleplayQuizAssignmentSnapshot {
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
    activitySectorCode: string | null;
    assignedUserId: string | null;
    category: string | null;
    coachId: string | null;
    difficulty: string | null;
    disc: string;
    domain: string | null;
    groupId: string | null;
    methodId: string | null;
    organizationId: string | null;
    personaId: string | null;
    resources: RoleplaySessionLockedResource[];
    scope: string;
    scorecardId: string | null;
}

export function hasRoleplayQuizAssignmentsChanged(
    current: readonly RoleplayQuizAssignmentSnapshot[],
    next: readonly RoleplayQuizAssignmentSnapshot[],
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}

export function hasRoleplaySessionLockedConfigurationChanged(
    current: RoleplaySessionLockedConfiguration,
    next: RoleplaySessionLockedConfiguration,
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}
