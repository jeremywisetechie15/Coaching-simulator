import { CONTENT_STATUS, type ContentStatus } from "./content-status";
import { CONTENT_VISIBILITY_SCOPE, type ContentVisibilityScope } from "./visibility-scope";

export interface ContentAudience {
    groupId?: string | null;
    organizationId?: string | null;
    scope: ContentVisibilityScope;
    userGroupIds?: readonly string[];
    userId?: string | null;
    userOrganizationIds?: readonly string[];
}

export const CONTENT_TRANSITION_BLOCK_CODE = {
    archivedRestoreUnsupported: "archived_restore_unsupported",
    publishedToDraftUnsupported: "published_to_draft_unsupported",
} as const;

export type ContentTransitionBlockCode =
    (typeof CONTENT_TRANSITION_BLOCK_CODE)[keyof typeof CONTENT_TRANSITION_BLOCK_CODE];

export interface ContentTransitionBlock {
    code: ContentTransitionBlockCode;
}

/**
 * Every viewer of a published parent must also be allowed to read its private
 * dependency. This access rule is independent from the content lifecycle.
 */
export function contentAudienceCoversDependency(
    parent: ContentAudience,
    dependency: ContentAudience,
) {
    if (dependency.scope === CONTENT_VISIBILITY_SCOPE.public) return true;

    switch (parent.scope) {
        case CONTENT_VISIBILITY_SCOPE.public:
            return false;
        case CONTENT_VISIBILITY_SCOPE.organization:
            return dependency.scope === CONTENT_VISIBILITY_SCOPE.organization
                && dependency.organizationId === parent.organizationId;
        case CONTENT_VISIBILITY_SCOPE.group:
            return (
                dependency.scope === CONTENT_VISIBILITY_SCOPE.organization
                && dependency.organizationId === parent.organizationId
            ) || (
                dependency.scope === CONTENT_VISIBILITY_SCOPE.group
                && dependency.groupId === parent.groupId
            );
        case CONTENT_VISIBILITY_SCOPE.user:
            return (
                dependency.scope === CONTENT_VISIBILITY_SCOPE.user
                && dependency.userId === parent.userId
            ) || (
                dependency.scope === CONTENT_VISIBILITY_SCOPE.organization
                && Boolean(dependency.organizationId)
                && (parent.userOrganizationIds ?? []).includes(dependency.organizationId ?? "")
            ) || (
                dependency.scope === CONTENT_VISIBILITY_SCOPE.group
                && Boolean(dependency.groupId)
                && (parent.userGroupIds ?? []).includes(dependency.groupId ?? "")
            );
    }
}

export function getContentTransitionBlock(
    currentStatus: ContentStatus,
    nextStatus: ContentStatus,
): ContentTransitionBlock | null {
    if (currentStatus === CONTENT_STATUS.archived && nextStatus !== CONTENT_STATUS.archived) {
        return { code: CONTENT_TRANSITION_BLOCK_CODE.archivedRestoreUnsupported };
    }

    if (currentStatus === CONTENT_STATUS.published && nextStatus === CONTENT_STATUS.draft) {
        return { code: CONTENT_TRANSITION_BLOCK_CODE.publishedToDraftUnsupported };
    }

    return null;
}

export const PUBLISHED_CONTENT_STATUS = CONTENT_STATUS.published;
