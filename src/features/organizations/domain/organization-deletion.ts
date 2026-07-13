export const ORGANIZATION_REMOVAL_ACTION = {
    deactivate: "deactivate",
    delete: "delete",
} as const;

export type OrganizationRemovalAction =
    (typeof ORGANIZATION_REMOVAL_ACTION)[keyof typeof ORGANIZATION_REMOVAL_ACTION];

export interface OrganizationRemovalUsage {
    hasAssociatedContent: boolean;
    hasAssociatedRoleplay: boolean;
    hasSessionHistory: boolean;
}

export function getOrganizationRemovalAction(usage: OrganizationRemovalUsage): OrganizationRemovalAction {
    const mustPreserveOrganization =
        usage.hasAssociatedContent || usage.hasAssociatedRoleplay || usage.hasSessionHistory;

    return mustPreserveOrganization
        ? ORGANIZATION_REMOVAL_ACTION.deactivate
        : ORGANIZATION_REMOVAL_ACTION.delete;
}
