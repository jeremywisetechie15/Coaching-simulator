export const CONTENT_VISIBILITY_SCOPE = {
    group: "group",
    organization: "organization",
    public: "public",
    user: "user",
} as const;

export const CONTENT_VISIBILITY_SCOPES = [
    CONTENT_VISIBILITY_SCOPE.public,
    CONTENT_VISIBILITY_SCOPE.organization,
    CONTENT_VISIBILITY_SCOPE.group,
    CONTENT_VISIBILITY_SCOPE.user,
] as const;

export type ContentVisibilityScope = (typeof CONTENT_VISIBILITY_SCOPES)[number];

export const ORGANIZATION_CONTENT_VISIBILITY_SCOPES = [
    CONTENT_VISIBILITY_SCOPE.public,
    CONTENT_VISIBILITY_SCOPE.organization,
] as const;

export type OrganizationContentVisibilityScope = (typeof ORGANIZATION_CONTENT_VISIBILITY_SCOPES)[number];

export const CONTENT_TARGET_SCOPES = [
    CONTENT_VISIBILITY_SCOPE.organization,
    CONTENT_VISIBILITY_SCOPE.group,
    CONTENT_VISIBILITY_SCOPE.user,
] as const;

export type ContentTargetScope = (typeof CONTENT_TARGET_SCOPES)[number];

export const CONTENT_VISIBILITY_SCOPE_LABELS: Record<ContentVisibilityScope, string> = {
    [CONTENT_VISIBILITY_SCOPE.group]: "Privé groupe",
    [CONTENT_VISIBILITY_SCOPE.organization]: "Privé organisation",
    [CONTENT_VISIBILITY_SCOPE.public]: "Public",
    [CONTENT_VISIBILITY_SCOPE.user]: "Privé utilisateur",
};

export const CONTENT_TARGET_SCOPE_LABELS: Record<ContentTargetScope, string> = {
    [CONTENT_VISIBILITY_SCOPE.group]: "Groupe",
    [CONTENT_VISIBILITY_SCOPE.organization]: "Organisation",
    [CONTENT_VISIBILITY_SCOPE.user]: "Utilisateur",
};

export const CONTENT_VISIBILITY_CHOICE = {
    private: "private",
    public: "public",
} as const;

export const CONTENT_VISIBILITY_CHOICES = [
    CONTENT_VISIBILITY_CHOICE.public,
    CONTENT_VISIBILITY_CHOICE.private,
] as const;

export type ContentVisibilityChoice = (typeof CONTENT_VISIBILITY_CHOICES)[number];

export const CONTENT_VISIBILITY_CHOICE_LABELS: Record<ContentVisibilityChoice, string> = {
    [CONTENT_VISIBILITY_CHOICE.private]: "Privé",
    [CONTENT_VISIBILITY_CHOICE.public]: "Public",
};

export const CONTENT_VISIBILITY_CHOICE_DESCRIPTIONS: Record<ContentVisibilityChoice, string> = {
    [CONTENT_VISIBILITY_CHOICE.private]: "Visible uniquement par une cible spécifique",
    [CONTENT_VISIBILITY_CHOICE.public]: "Visible par tous les utilisateurs de la plateforme",
};

export function isPrivateContentScope(scope: ContentVisibilityScope) {
    return scope !== CONTENT_VISIBILITY_SCOPE.public;
}

export function getContentVisibilityScopeLabel(scope: ContentVisibilityScope) {
    return CONTENT_VISIBILITY_SCOPE_LABELS[scope];
}
