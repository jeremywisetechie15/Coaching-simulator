import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { OrganizationActivityStatus } from "./organization-detail";

export interface OrganizationActivityTarget {
    assignedUserId?: string | null;
    groupId?: string | null;
    organizationId?: string | null;
    visibilityScope?: string | null;
}

export interface OrganizationLearnerActivity {
    status: string | null;
    userId: string | null;
}

export interface OrganizationActivityAudience {
    activeGroupMemberIdsByGroupId: ReadonlyMap<string, readonly string[]>;
    activeMemberIds: readonly string[];
}

export function indexOrganizationLearnerActivitiesByContentId<T>(
    rows: readonly T[],
    getContentId: (row: T) => string | null,
    getStatus: (row: T) => string | null,
    getUserId: (row: T) => string | null,
) {
    const activitiesByContentId = new Map<string, OrganizationLearnerActivity[]>();

    for (const row of rows) {
        const contentId = getContentId(row);
        if (!contentId) continue;
        const activities = activitiesByContentId.get(contentId) ?? [];
        activities.push({ status: getStatus(row), userId: getUserId(row) });
        activitiesByContentId.set(contentId, activities);
    }

    return activitiesByContentId;
}

function addActiveMember(target: Set<string>, activeMemberIds: ReadonlySet<string>, userId?: string | null) {
    if (userId && activeMemberIds.has(userId)) {
        target.add(userId);
    }
}

function addActiveMembers(target: Set<string>, userIds: readonly string[] | undefined) {
    for (const userId of userIds ?? []) {
        target.add(userId);
    }
}

/**
 * Resolves the cohort represented by an activity in the organization view.
 * Public content is included only for the organization's explicit assignees;
 * it does not implicitly target every member of the organization.
 */
export function resolveOrganizationActivityLearnerIds({
    activity,
    audience,
    explicitAssigneeIds = [],
    organizationId,
}: {
    activity: OrganizationActivityTarget;
    audience: OrganizationActivityAudience;
    explicitAssigneeIds?: readonly string[];
    organizationId: string;
}): string[] {
    const activeMemberIds = new Set(audience.activeMemberIds);
    const learnerIds = new Set<string>();

    for (const userId of explicitAssigneeIds) {
        addActiveMember(learnerIds, activeMemberIds, userId);
    }

    switch (activity.visibilityScope) {
        case CONTENT_VISIBILITY_SCOPE.organization:
            if (activity.organizationId === organizationId) {
                addActiveMembers(learnerIds, audience.activeMemberIds);
            }
            break;
        case CONTENT_VISIBILITY_SCOPE.group:
            if (activity.groupId) {
                addActiveMembers(
                    learnerIds,
                    audience.activeGroupMemberIdsByGroupId.get(activity.groupId),
                );
            }
            break;
        case CONTENT_VISIBILITY_SCOPE.user:
            addActiveMember(learnerIds, activeMemberIds, activity.assignedUserId);
            break;
        case CONTENT_VISIBILITY_SCOPE.public:
            break;
        default:
            // Compatibility with historical rows created before visibility_scope was normalized.
            if (activity.assignedUserId) {
                addActiveMember(learnerIds, activeMemberIds, activity.assignedUserId);
            } else if (activity.groupId) {
                addActiveMembers(
                    learnerIds,
                    audience.activeGroupMemberIdsByGroupId.get(activity.groupId),
                );
            } else if (activity.organizationId === organizationId) {
                addActiveMembers(learnerIds, audience.activeMemberIds);
            }
    }

    return Array.from(learnerIds).sort();
}

/**
 * A cohort is completed only when every targeted learner has completed the
 * activity. Any admissible learner activity otherwise means "in progress".
 */
export function getOrganizationCohortActivityStatus(
    learnerIds: readonly string[],
    activities: readonly OrganizationLearnerActivity[],
): OrganizationActivityStatus {
    const learnerIdSet = new Set(learnerIds);
    const relevantActivities = activities.filter(
        (activity): activity is OrganizationLearnerActivity & { userId: string } =>
            Boolean(activity.userId && learnerIdSet.has(activity.userId)),
    );

    if (learnerIds.length === 0 || relevantActivities.length === 0) {
        return "not_started";
    }

    const completedLearnerIds = new Set(
        relevantActivities
            .filter((activity) => activity.status === "completed")
            .map((activity) => activity.userId),
    );

    return learnerIds.every((userId) => completedLearnerIds.has(userId))
        ? "completed"
        : "in_progress";
}
