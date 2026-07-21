import {
    CONTENT_VISIBILITY_SCOPE,
    type ContentVisibilityScope,
} from "@/features/content/domain";

export type RoleplayPublicationField =
    | "assignedUserId"
    | "category"
    | "coachId"
    | "difficulty"
    | "domain"
    | "groupId"
    | "learnerRole"
    | "methodId"
    | "organizationId"
    | "personaId"
    | "scorecardId";

export interface RoleplayPublicationInput {
    assignedUserId?: string | null;
    category?: string | null;
    coachId?: string | null;
    difficulty?: string | null;
    domain?: string | null;
    groupId?: string | null;
    learnerRole?: string | null;
    methodId?: string | null;
    organizationId?: string | null;
    personaId?: string | null;
    scope: ContentVisibilityScope;
    scorecardId?: string | null;
}

export interface RoleplayPublicationIssue {
    field: RoleplayPublicationField;
    message: string;
}

function hasValue(value: string | null | undefined) {
    return Boolean(value?.trim());
}

export function getRoleplayPublicationIssues(
    roleplay: RoleplayPublicationInput,
): RoleplayPublicationIssue[] {
    const issues: RoleplayPublicationIssue[] = [];
    const requiredFields = [
        ["personaId", roleplay.personaId, "Le persona est requis pour publier le roleplay."],
        ["coachId", roleplay.coachId, "Le coach est requis pour publier le roleplay."],
        ["difficulty", roleplay.difficulty, "Le niveau de difficulté est requis pour publier le roleplay."],
        ["methodId", roleplay.methodId, "La méthode est requise pour publier le roleplay."],
        ["scorecardId", roleplay.scorecardId, "La scorecard est requise pour publier le roleplay."],
        ["domain", roleplay.domain, "Le domaine est requis pour publier le roleplay."],
        ["category", roleplay.category, "La catégorie est requise pour publier le roleplay."],
        ["learnerRole", roleplay.learnerRole, "Votre rôle est requis pour publier le roleplay."],
    ] as const;

    for (const [field, value, message] of requiredFields) {
        if (!hasValue(value)) issues.push({ field, message });
    }

    if (
        (roleplay.scope === CONTENT_VISIBILITY_SCOPE.organization ||
            roleplay.scope === CONTENT_VISIBILITY_SCOPE.group) &&
        !hasValue(roleplay.organizationId)
    ) {
        issues.push({
            field: "organizationId",
            message:
                roleplay.scope === CONTENT_VISIBILITY_SCOPE.group
                    ? "Un roleplay privé groupe doit être lié à une organisation."
                    : "Un roleplay privé organisation doit être lié à une organisation.",
        });
    }

    if (roleplay.scope === CONTENT_VISIBILITY_SCOPE.group && !hasValue(roleplay.groupId)) {
        issues.push({
            field: "groupId",
            message: "Un roleplay privé groupe doit être lié à un groupe.",
        });
    }

    if (roleplay.scope === CONTENT_VISIBILITY_SCOPE.user && !hasValue(roleplay.assignedUserId)) {
        issues.push({
            field: "assignedUserId",
            message: "Un roleplay privé utilisateur doit être lié à un utilisateur.",
        });
    }

    return issues;
}
