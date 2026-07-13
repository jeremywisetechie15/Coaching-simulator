import { describe, expect, it } from "vitest";
import {
    getEffectiveOrganizationMemberStatus,
    ORGANIZATION_MEMBER_STATUS,
} from "./organization-member";
import { ORGANIZATION_STATUS } from "./organization-list";

describe("organization member status", () => {
    it("keeps an active membership active for an active organization", () => {
        expect(getEffectiveOrganizationMemberStatus(
            ORGANIZATION_MEMBER_STATUS.active,
            ORGANIZATION_STATUS.active,
        )).toBe(ORGANIZATION_MEMBER_STATUS.active);
    });

    it("suspends access when the organization is suspended", () => {
        expect(getEffectiveOrganizationMemberStatus(
            ORGANIZATION_MEMBER_STATUS.active,
            ORGANIZATION_STATUS.suspended,
        )).toBe(ORGANIZATION_MEMBER_STATUS.suspended);
    });

    it("does not reactivate an individually suspended member", () => {
        expect(getEffectiveOrganizationMemberStatus(
            ORGANIZATION_MEMBER_STATUS.suspended,
            ORGANIZATION_STATUS.active,
        )).toBe(ORGANIZATION_MEMBER_STATUS.suspended);
    });
});
