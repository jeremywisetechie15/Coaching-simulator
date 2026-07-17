import { describe, expect, it } from "vitest";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { resolveActiveUserAssignmentTargets } from "./user-assignment-targets";

describe("resolveActiveUserAssignmentTargets", () => {
    it("keeps only active memberships of active organizations", () => {
        const targets = resolveActiveUserAssignmentTargets({
            groupMemberships: [],
            groups: [],
            organizationMemberships: [
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "active-user" },
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "invited-user" },
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.suspended, user_id: "suspended-user" },
                { organization_id: "org-suspended", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "org-suspended-user" },
            ],
            organizations: [
                { id: "org-active", status: ORGANIZATION_STATUS.active },
                { id: "org-suspended", status: ORGANIZATION_STATUS.suspended },
            ],
            userIds: ["active-user", "invited-user", "suspended-user", "org-suspended-user"],
        });

        expect(Object.fromEntries(targets)).toEqual({
            "active-user": { groupIds: [], organizationIds: ["org-active"] },
            "invited-user": { groupIds: [], organizationIds: [] },
            "suspended-user": { groupIds: [], organizationIds: [] },
            "org-suspended-user": { groupIds: [], organizationIds: [] },
        });
    });

    it("keeps only active groups with a membership in their active organization", () => {
        const targets = resolveActiveUserAssignmentTargets({
            groupMemberships: [
                { group_id: "group-valid", user_id: "active-user" },
                { group_id: "group-archived", user_id: "active-user" },
                { group_id: "group-other-org", user_id: "active-user" },
                { group_id: "group-valid", user_id: "invited-user" },
            ],
            groups: [
                { id: "group-valid", organization_id: "org-active", status: "active" },
                { id: "group-archived", organization_id: "org-active", status: "archived" },
                { id: "group-other-org", organization_id: "org-other", status: "active" },
            ],
            organizationMemberships: [
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "active-user" },
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "user-without-group-membership" },
                { organization_id: "org-active", status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "invited-user" },
                { organization_id: "org-other", status: ORGANIZATION_MEMBER_STATUS.suspended, user_id: "active-user" },
            ],
            organizations: [
                { id: "org-active", status: ORGANIZATION_STATUS.active },
                { id: "org-other", status: ORGANIZATION_STATUS.active },
            ],
            userIds: ["active-user", "user-without-group-membership", "invited-user"],
        });

        expect(Object.fromEntries(targets)).toEqual({
            "active-user": {
                groupIds: ["group-valid"],
                organizationIds: ["org-active"],
            },
            "user-without-group-membership": {
                groupIds: [],
                organizationIds: ["org-active"],
            },
            "invited-user": { groupIds: [], organizationIds: [] },
        });
    });

    it("rejects a group membership when the user has no active membership in the group's organization", () => {
        const targets = resolveActiveUserAssignmentTargets({
            groupMemberships: [{ group_id: "group-1", user_id: "user-1" }],
            groups: [{ id: "group-1", organization_id: "org-1", status: "active" }],
            organizationMemberships: [
                { organization_id: "org-1", status: ORGANIZATION_MEMBER_STATUS.suspended, user_id: "user-1" },
            ],
            organizations: [{ id: "org-1", status: ORGANIZATION_STATUS.active }],
            userIds: ["user-1"],
        });

        expect(targets.get("user-1")).toEqual({ groupIds: [], organizationIds: [] });
    });
});
