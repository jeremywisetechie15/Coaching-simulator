import { describe, expect, it } from "vitest";
import { createUserGroupsResult, type UserGroupDbRow, type UserGroupMemberDbRow } from "./user-groups.persistence";

const organizationGroups: UserGroupDbRow[] = [
    {
        description: "Equipe commerciale",
        id: "11111111-1111-4111-8111-111111111111",
        name: "Sales",
        organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "active",
    },
    {
        description: "Equipe support",
        id: "22222222-2222-4222-8222-222222222222",
        name: "Support",
        organization_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        status: "active",
    },
];

const memberships: UserGroupMemberDbRow[] = [
    {
        assigned_at: "2026-01-10T10:00:00.000Z",
        group_id: "11111111-1111-4111-8111-111111111111",
    },
    {
        assigned_at: "2026-01-11T10:00:00.000Z",
        group_id: "99999999-9999-4999-8999-999999999999",
    },
];

describe("user-groups.persistence", () => {
    it("separates assigned groups from available organization groups", () => {
        const result = createUserGroupsResult(organizationGroups, memberships);

        expect(result.groups).toHaveLength(1);
        expect(result.groups[0]).toMatchObject({
            description: "Equipe commerciale",
            id: "11111111-1111-4111-8111-111111111111",
            name: "Sales",
        });
        expect(result.availableGroups).toEqual([
            {
                description: "Equipe support",
                id: "22222222-2222-4222-8222-222222222222",
                name: "Support",
            },
        ]);
    });
});
