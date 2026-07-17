import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "./organization-detail";
import { ORGANIZATION_MEMBER_STATUS } from "./organization-member";
import {
    createOrganizationContentScopeContext,
    resolveOrganizationContentCoverage,
    resolveOrganizationContentIdsByOrganizationId,
    type OrganizationScopedContent,
} from "./organization-content-scope";

function content(
    id: string,
    overrides: Partial<OrganizationScopedContent> = {},
): OrganizationScopedContent {
    return {
        assignedUserId: null,
        groupId: null,
        id,
        isActive: true,
        organizationId: null,
        status: CONTENT_STATUS.published,
        visibilityScope: CONTENT_VISIBILITY_SCOPE.public,
        ...overrides,
    };
}

describe("organization content scope", () => {
    const context = createOrganizationContentScopeContext({
        groupMemberships: [
            { groupId: "group-active", userId: "active-user" },
            { groupId: "group-active", userId: "invited-user" },
            { groupId: "group-active", userId: "removed-user" },
            { groupId: "group-archived", userId: "active-user" },
        ],
        groups: [
            { id: "group-active", organizationId: "organization-a", status: ORGANIZATION_GROUP_STATUS.active },
            { id: "group-archived", organizationId: "organization-a", status: ORGANIZATION_GROUP_STATUS.archived },
        ],
        memberships: [
            { organizationId: "organization-a", status: ORGANIZATION_MEMBER_STATUS.active, userId: "active-user" },
            { organizationId: "organization-a", status: ORGANIZATION_MEMBER_STATUS.invited, userId: "invited-user" },
            { organizationId: "organization-a", status: ORGANIZATION_MEMBER_STATUS.suspended, userId: "suspended-user" },
            { organizationId: "organization-a", status: ORGANIZATION_MEMBER_STATUS.removed, userId: "removed-user" },
            { organizationId: "organization-b", status: ORGANIZATION_MEMBER_STATUS.active, userId: "active-user" },
        ],
        organizationIds: ["organization-a", "organization-b"],
    });

    it("keeps user counters contextual to their organization and active groups", () => {
        const coverage = resolveOrganizationContentCoverage({
            content: [
                content("organization-content", {
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
                content("group-content", {
                    groupId: "group-active",
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.group,
                }),
                content("direct-content", {
                    assignedUserId: "invited-user",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.user,
                }),
                content("public-global"),
                content("public-explicit"),
            ],
            context,
            explicitAssignments: [{ contentId: "public-explicit", userId: "suspended-user" }],
        });

        expect(Array.from(
            coverage.contentIdsByOrganizationUserId.get("organization-a")?.get("active-user") ?? [],
        ).sort()).toEqual(["group-content", "organization-content"]);
        expect(Array.from(
            coverage.contentIdsByOrganizationUserId.get("organization-a")?.get("invited-user") ?? [],
        ).sort()).toEqual(["direct-content", "group-content", "organization-content"]);
        expect(Array.from(
            coverage.contentIdsByOrganizationUserId.get("organization-a")?.get("suspended-user") ?? [],
        ).sort()).toEqual(["organization-content", "public-explicit"]);
        expect(Array.from(
            coverage.contentIdsByGroupUserId.get("group-active")?.get("invited-user") ?? [],
        )).toEqual(["group-content"]);
        expect(coverage.contentIdsByGroupUserId.get("group-active")?.has("removed-user")).toBe(false);
    });

    it("uses the non-removed roster and active groups for structural counters", () => {
        expect(context.userCountByOrganizationId.get("organization-a")).toBe(3);
        expect(context.userCountByOrganizationId.get("organization-b")).toBe(1);
        expect(context.groupCountByOrganizationId.get("organization-a")).toBe(1);
        expect(context.activeGroupIds).toEqual(["group-active"]);
    });

    it("counts only active published content attached to the organization scope", () => {
        const contentIdsByOrganizationId = resolveOrganizationContentIdsByOrganizationId({
            content: [
                content("organization-content", {
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
                content("active-group-content", {
                    groupId: "group-active",
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.group,
                }),
                content("archived-group-content", {
                    groupId: "group-archived",
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.group,
                }),
                content("direct-active-user", {
                    assignedUserId: "active-user",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.user,
                }),
                content("direct-invited-user", {
                    assignedUserId: "invited-user",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.user,
                }),
                content("direct-removed-user", {
                    assignedUserId: "removed-user",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.user,
                }),
                content("public-global"),
                content("public-explicit"),
                content("draft-content", {
                    organizationId: "organization-a",
                    status: CONTENT_STATUS.draft,
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
                content("inactive-content", {
                    isActive: false,
                    organizationId: "organization-a",
                    visibilityScope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
            ],
            context,
            explicitAssignments: [
                { contentId: "public-explicit", userId: "suspended-user" },
                { contentId: "organization-content", userId: "active-user" },
                { contentId: "public-global", userId: "removed-user" },
            ],
        });

        expect(Array.from(contentIdsByOrganizationId.get("organization-a") ?? []).sort()).toEqual([
            "active-group-content",
            "direct-active-user",
            "direct-invited-user",
            "organization-content",
            "public-explicit",
        ]);
        expect(Array.from(contentIdsByOrganizationId.get("organization-b") ?? []).sort()).toEqual([
            "direct-active-user",
            "organization-content",
        ]);
    });
});
