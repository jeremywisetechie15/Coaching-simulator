import { describe, expect, it } from "vitest";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { mapOrganizationUserRows } from "./list-organization-users";

describe("list-organization-users", () => {
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
        );

        expect(users).toEqual([
            {
                email: "adrien@example.com",
                id: "11111111-1111-4111-8111-111111111111",
                initials: "AD",
                name: "Adrien Dupont",
                quizCount: 0,
                role: "Manager",
                roleplayCount: 0,
                status: ORGANIZATION_MEMBER_STATUS.invited,
            },
            {
                email: "zoe@example.com",
                id: "22222222-2222-4222-8222-222222222222",
                initials: "ZM",
                name: "Zoé Martin",
                quizCount: 0,
                role: "Learner",
                roleplayCount: 0,
                status: ORGANIZATION_MEMBER_STATUS.active,
            },
        ]);
    });
});
