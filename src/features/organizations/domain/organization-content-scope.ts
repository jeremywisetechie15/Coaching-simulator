import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
    type ContentVisibilityScope,
} from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "./organization-detail";
import { ORGANIZATION_MEMBER_STATUS } from "./organization-member";

export const ORGANIZATION_COUNTED_CONTENT_STATUS = CONTENT_STATUS.published;
export const ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE = true;

export interface OrganizationContentScopeMembership {
    organizationId: string | null;
    status: string | null;
    userId: string | null;
}

export interface OrganizationContentScopeGroup {
    id: string;
    organizationId: string | null;
    status: string | null;
}

export interface OrganizationContentScopeGroupMembership {
    groupId: string | null;
    userId: string | null;
}

export interface OrganizationScopedContent {
    assignedUserId: string | null;
    groupId: string | null;
    id: string;
    isActive: boolean | null;
    organizationId: string | null;
    status: string | null;
    visibilityScope: ContentVisibilityScope | string | null;
}

export interface OrganizationExplicitContentAssignment {
    contentId: string;
    userId: string;
}

export interface OrganizationContentScopeContext {
    activeGroupIds: string[];
    activeGroupOrganizationIdByGroupId: ReadonlyMap<string, string>;
    organizationIds: string[];
    organizationIdsByRosterUserId: ReadonlyMap<string, ReadonlySet<string>>;
    rosterUserIdsByActiveGroupId: ReadonlyMap<string, ReadonlySet<string>>;
    rosterUserIdsByOrganizationId: ReadonlyMap<string, ReadonlySet<string>>;
    rosterUserIds: string[];
    groupCountByOrganizationId: ReadonlyMap<string, number>;
    userCountByOrganizationId: ReadonlyMap<string, number>;
}

function getOrCreateSet<TKey>(map: Map<TKey, Set<string>>, key: TKey) {
    const current = map.get(key);

    if (current) {
        return current;
    }

    const created = new Set<string>();
    map.set(key, created);

    return created;
}

export function createOrganizationContentScopeContext({
    groupMemberships = [],
    groups,
    memberships,
    organizationIds,
}: {
    groupMemberships?: OrganizationContentScopeGroupMembership[];
    groups: OrganizationContentScopeGroup[];
    memberships: OrganizationContentScopeMembership[];
    organizationIds: string[];
}): OrganizationContentScopeContext {
    const uniqueOrganizationIds = Array.from(new Set(organizationIds));
    const requestedOrganizationIds = new Set(uniqueOrganizationIds);
    const rosterUserIdsByOrganizationId = new Map(
        uniqueOrganizationIds.map((organizationId) => [organizationId, new Set<string>()] as const),
    );
    const organizationIdsByRosterUserId = new Map<string, Set<string>>();

    for (const membership of memberships) {
        if (
            !membership.organizationId
            || !membership.userId
            || !requestedOrganizationIds.has(membership.organizationId)
            || membership.status === ORGANIZATION_MEMBER_STATUS.removed
        ) {
            continue;
        }

        rosterUserIdsByOrganizationId.get(membership.organizationId)?.add(membership.userId);
        getOrCreateSet(organizationIdsByRosterUserId, membership.userId).add(membership.organizationId);
    }

    const activeGroupOrganizationIdByGroupId = new Map<string, string>();
    const activeGroupIdsByOrganizationId = new Map(
        uniqueOrganizationIds.map((organizationId) => [organizationId, new Set<string>()] as const),
    );

    for (const group of groups) {
        if (
            !group.organizationId
            || !requestedOrganizationIds.has(group.organizationId)
            || group.status !== ORGANIZATION_GROUP_STATUS.active
        ) {
            continue;
        }

        activeGroupOrganizationIdByGroupId.set(group.id, group.organizationId);
        activeGroupIdsByOrganizationId.get(group.organizationId)?.add(group.id);
    }

    const rosterUserIdsByActiveGroupId = new Map(
        Array.from(activeGroupOrganizationIdByGroupId.keys(), (groupId) => [groupId, new Set<string>()] as const),
    );

    for (const membership of groupMemberships) {
        if (!membership.groupId || !membership.userId) {
            continue;
        }

        const organizationId = activeGroupOrganizationIdByGroupId.get(membership.groupId);
        if (!organizationId || !rosterUserIdsByOrganizationId.get(organizationId)?.has(membership.userId)) {
            continue;
        }

        rosterUserIdsByActiveGroupId.get(membership.groupId)?.add(membership.userId);
    }

    return {
        activeGroupIds: Array.from(activeGroupOrganizationIdByGroupId.keys()),
        activeGroupOrganizationIdByGroupId,
        groupCountByOrganizationId: new Map(
            uniqueOrganizationIds.map((organizationId) => [
                organizationId,
                activeGroupIdsByOrganizationId.get(organizationId)?.size ?? 0,
            ]),
        ),
        organizationIds: uniqueOrganizationIds,
        organizationIdsByRosterUserId,
        rosterUserIdsByActiveGroupId,
        rosterUserIdsByOrganizationId,
        rosterUserIds: Array.from(organizationIdsByRosterUserId.keys()),
        userCountByOrganizationId: new Map(
            uniqueOrganizationIds.map((organizationId) => [
                organizationId,
                rosterUserIdsByOrganizationId.get(organizationId)?.size ?? 0,
            ]),
        ),
    };
}

function isCountedContent(content: OrganizationScopedContent) {
    return (
        content.isActive === ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE
        && content.status === ORGANIZATION_COUNTED_CONTENT_STATUS
    );
}

export interface OrganizationContentCoverage {
    contentIdsByGroupUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
    contentIdsByOrganizationId: ReadonlyMap<string, ReadonlySet<string>>;
    contentIdsByOrganizationUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
}

function createContentIdsByUserId(userIds: Iterable<string>) {
    return new Map(Array.from(userIds, (userId) => [userId, new Set<string>()] as const));
}

function addContentToUsers(
    contentIdsByUserId: Map<string, Set<string>> | undefined,
    contentId: string,
    userIds: Iterable<string>,
) {
    for (const userId of userIds) {
        contentIdsByUserId?.get(userId)?.add(contentId);
    }
}

export function resolveOrganizationContentCoverage({
    content,
    context,
    explicitAssignments,
}: {
    content: OrganizationScopedContent[];
    context: OrganizationContentScopeContext;
    explicitAssignments: OrganizationExplicitContentAssignment[];
}): OrganizationContentCoverage {
    const contentIdsByOrganizationId = new Map(
        context.organizationIds.map((organizationId) => [organizationId, new Set<string>()] as const),
    );
    const contentIdsByOrganizationUserId = new Map(
        context.organizationIds.map((organizationId) => [
            organizationId,
            createContentIdsByUserId(context.rosterUserIdsByOrganizationId.get(organizationId) ?? []),
        ] as const),
    );
    const contentIdsByGroupUserId = new Map(
        context.activeGroupIds.map((groupId) => [
            groupId,
            createContentIdsByUserId(context.rosterUserIdsByActiveGroupId.get(groupId) ?? []),
        ] as const),
    );
    const countedContentById = new Map(
        content.filter(isCountedContent).map((item) => [item.id, item]),
    );

    const addOrganizationContent = (organizationId: string, contentId: string, userIds: Iterable<string>) => {
        contentIdsByOrganizationId.get(organizationId)?.add(contentId);
        addContentToUsers(contentIdsByOrganizationUserId.get(organizationId), contentId, userIds);
    };

    for (const item of countedContentById.values()) {
        if (
            item.visibilityScope === CONTENT_VISIBILITY_SCOPE.organization
            && item.organizationId
            && contentIdsByOrganizationId.has(item.organizationId)
        ) {
            addOrganizationContent(
                item.organizationId,
                item.id,
                context.rosterUserIdsByOrganizationId.get(item.organizationId) ?? [],
            );
            continue;
        }

        if (item.visibilityScope === CONTENT_VISIBILITY_SCOPE.group && item.groupId) {
            const organizationId = context.activeGroupOrganizationIdByGroupId.get(item.groupId);
            if (organizationId) {
                const groupUserIds = context.rosterUserIdsByActiveGroupId.get(item.groupId) ?? [];
                addOrganizationContent(organizationId, item.id, groupUserIds);
                addContentToUsers(contentIdsByGroupUserId.get(item.groupId), item.id, groupUserIds);
            }
            continue;
        }

        if (item.visibilityScope === CONTENT_VISIBILITY_SCOPE.user && item.assignedUserId) {
            for (const organizationId of context.organizationIdsByRosterUserId.get(item.assignedUserId) ?? []) {
                addOrganizationContent(organizationId, item.id, [item.assignedUserId]);
            }
        }
    }

    for (const assignment of explicitAssignments) {
        if (!countedContentById.has(assignment.contentId)) {
            continue;
        }

        for (const organizationId of context.organizationIdsByRosterUserId.get(assignment.userId) ?? []) {
            addOrganizationContent(organizationId, assignment.contentId, [assignment.userId]);
        }
    }

    return {
        contentIdsByGroupUserId,
        contentIdsByOrganizationId,
        contentIdsByOrganizationUserId,
    };
}

export function resolveOrganizationContentIdsByOrganizationId(input: {
    content: OrganizationScopedContent[];
    context: OrganizationContentScopeContext;
    explicitAssignments: OrganizationExplicitContentAssignment[];
}): ReadonlyMap<string, ReadonlySet<string>> {
    return resolveOrganizationContentCoverage(input).contentIdsByOrganizationId;
}
