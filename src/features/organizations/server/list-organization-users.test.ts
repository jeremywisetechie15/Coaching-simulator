import { describe, expect, it } from "vitest";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import {
    filterOrganizationRosterMemberships,
    mapOrganizationUserRows,
} from "./list-organization-users";

describe("list-organization-users", () => {
    it("keeps configured roster members and excludes removed memberships", () => {
        expect(filterOrganizationRosterMemberships([
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "active-user" },
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "invited-user" },
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.suspended, user_id: "suspended-user" },
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.removed, user_id: "removed-user" },
        ])).toEqual([
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "active-user" },
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "invited-user" },
            { role: "member", status: ORGANIZATION_MEMBER_STATUS.suspended, user_id: "suspended-user" },
        ]);
    });

    it("maps organization memberships to table rows sorted by user name", () => {
        const users = mapOrganizationUserRows(
            [
                {
                    role: "member",
                    status: "active",
                    user_id: "22222222-2222-4222-8222-222222222222",
                },
                {
                    role: "manager",
                    status: "invited",
                    user_id: "11111111-1111-4111-8111-111111111111",
                },
            ],
            [
                {
                    email: "zoe@example.com",
                    first_name: "Zoé",
                    id: "22222222-2222-4222-8222-222222222222",
                    last_name: "Martin",
                    name: null,
                },
                {
                    email: "adrien@example.com",
                    first_name: "Adrien",
                    id: "11111111-1111-4111-8111-111111111111",
                    last_name: "Dupont",
                    name: null,
                },
            ],
            new Map([
                [
                    "11111111-1111-4111-8111-111111111111",
                    { quizCount: 2, roleplayCount: 4 },
                ],
                [
                    "22222222-2222-4222-8222-222222222222",
                    { quizCount: 3, roleplayCount: 5 },
                ],
            ]),
        );

        expect(users).toEqual([
            {
                email: "adrien@example.com",
                id: "11111111-1111-4111-8111-111111111111",
                initials: "AD",
                name: "Adrien Dupont",
                quizCount: 2,
                role: "Manager",
                roleplayCount: 4,
                status: ORGANIZATION_MEMBER_STATUS.invited,
            },
            {
                email: "zoe@example.com",
                id: "22222222-2222-4222-8222-222222222222",
                initials: "ZM",
                name: "Zoé Martin",
                quizCount: 3,
                role: "Learner",
                roleplayCount: 5,
                status: ORGANIZATION_MEMBER_STATUS.active,
            },
        ]);
    });
});
