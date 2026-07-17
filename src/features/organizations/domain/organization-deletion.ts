export const ORGANIZATION_REMOVAL_ACTION = {
    blocked: "blocked",
    deactivate: "deactivate",
    delete: "delete",
} as const;

export const ORGANIZATION_MEMBERS_REMOVAL_MESSAGE =
    "Retirez tous les utilisateurs de l’organisation avant de pouvoir la supprimer.";

export type OrganizationRemovalAction =
    (typeof ORGANIZATION_REMOVAL_ACTION)[keyof typeof ORGANIZATION_REMOVAL_ACTION];

export interface OrganizationRemovalUsage {
    hasAssociatedContent: boolean;
    hasAssociatedRoleplay: boolean;
    hasMembers: boolean;
    hasSessionHistory: boolean;
}

export function getOrganizationRemovalAction(usage: OrganizationRemovalUsage): OrganizationRemovalAction {
    const mustPreserveOrganization =
        usage.hasAssociatedContent || usage.hasAssociatedRoleplay || usage.hasSessionHistory;

    if (mustPreserveOrganization) {
        return ORGANIZATION_REMOVAL_ACTION.deactivate;
    }

    return usage.hasMembers
        ? ORGANIZATION_REMOVAL_ACTION.blocked
        : ORGANIZATION_REMOVAL_ACTION.delete;
}
