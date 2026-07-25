import { describe, expect, it } from "vitest";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { resolveContentTargetOptions } from "./list-content-target-options";

describe("content target options", () => {
    it("keeps active targets and only preserves current inactive targets as unavailable", () => {
        const options = resolveContentTargetOptions({
            current: {
                groupId: "group-archived",
                organizationId: "org-suspended",
                userId: "user-invited",
            },
            groupMembers: [
                { group_id: "group-active", user_id: "user-active" },
                { group_id: "group-archived", user_id: "user-invited" },
            ],
            groups: [
                {
                    id: "group-active",
                    name: "Actifs",
                    organization_id: "org-active",
                    status: ORGANIZATION_GROUP_STATUS.active,
                },
                {
                    id: "group-archived",
                    name: "Archives",
                    organization_id: "org-suspended",
                    status: ORGANIZATION_GROUP_STATUS.archived,
                },
            ],
            organizationMembers: [
                {
                    organization_id: "org-active",
                    status: ORGANIZATION_MEMBER_STATUS.active,
                    user_id: "user-active",
                },
                {
                    organization_id: "org-suspended",
                    status: ORGANIZATION_MEMBER_STATUS.invited,
                    user_id: "user-invited",
                },
                {
                    organization_id: "org-active",
                    status: ORGANIZATION_MEMBER_STATUS.removed,
                    user_id: "user-removed",
                },
            ],
            organizations: [
                { id: "org-active", name: "Active", status: ORGANIZATION_STATUS.active },
                { id: "org-suspended", name: "Suspendue", status: ORGANIZATION_STATUS.suspended },
            ],
            profiles: [
                {
                    email: "active@example.com",
                    first_name: "User",
                    id: "user-active",
                    last_name: "Active",
                    name: null,
                },
                {
                    email: "invite@example.com",
                    first_name: "User",
                    id: "user-invited",
                    last_name: "Invité",
                    name: null,
                },
                {
                    email: "removed@example.com",
                    first_name: "User",
                    id: "user-removed",
                    last_name: "Retiré",
                    name: null,
                },
            ],
        });

        expect(options.organizations).toEqual([
            { id: "org-active", isSelectable: true, name: "Active" },
            { id: "org-suspended", isSelectable: false, name: "Suspendue" },
        ]);
        expect(options.groups).toEqual([
            {
                id: "group-active",
                isSelectable: true,
                name: "Actifs",
                organizationId: "org-active",
            },
            {
                id: "group-archived",
                isSelectable: false,
                name: "Archives",
                organizationId: "org-suspended",
            },
        ]);
        expect(options.users).toEqual([
            {
                groupIds: ["group-active"],
                id: "user-active",
                isSelectable: true,
                name: "User Active",
                organizationIds: ["org-active"],
            },
            {
                groupIds: ["group-archived"],
                id: "user-invited",
                isSelectable: false,
                name: "User Invité",
                organizationIds: ["org-suspended"],
            },
        ]);
    });
});
