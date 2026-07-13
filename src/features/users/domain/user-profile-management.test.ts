import { describe, expect, it } from "vitest";
import { ORGANIZATION_MEMBER_ROLE } from "@/features/organizations/domain/organization-member";
import { PLATFORM_ROLE, USER_ROLE } from "./users";
import { getEditableUserRoleOptions, getUserRoleUpdateDecision } from "./user-profile-management";

describe("user profile management", () => {
    it("only exposes organization roles for regular users", () => {
        expect(getEditableUserRoleOptions(PLATFORM_ROLE.user).map((option) => option.value)).toEqual([
            USER_ROLE.manager,
            USER_ROLE.learner,
        ]);
    });

    it("keeps platform administrator changes outside the application", () => {
        expect(getUserRoleUpdateDecision(PLATFORM_ROLE.user, USER_ROLE.admin).allowed).toBe(false);
        expect(getUserRoleUpdateDecision(PLATFORM_ROLE.admin, USER_ROLE.learner).allowed).toBe(false);
    });

    it("maps learner and manager roles to organization memberships", () => {
        expect(getUserRoleUpdateDecision(PLATFORM_ROLE.user, USER_ROLE.learner).organizationRole)
            .toBe(ORGANIZATION_MEMBER_ROLE.member);
        expect(getUserRoleUpdateDecision(PLATFORM_ROLE.user, USER_ROLE.manager).organizationRole)
            .toBe(ORGANIZATION_MEMBER_ROLE.manager);
    });
});
