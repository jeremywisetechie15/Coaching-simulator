import { describe, expect, it } from "vitest";
import { ORGANIZATION_MEMBER_STATUS } from "./organization-member";
import {
    canResendOrganizationInvitation,
    getOrganizationInvitationResendSuccessMessage,
    isOrganizationInvitationResendCoolingDown,
} from "./organization-invitation";

describe("organization invitation", () => {
    it("allows a resend only for an invited membership", () => {
        expect(canResendOrganizationInvitation(ORGANIZATION_MEMBER_STATUS.invited)).toBe(true);
        expect(canResendOrganizationInvitation(ORGANIZATION_MEMBER_STATUS.active)).toBe(false);
        expect(canResendOrganizationInvitation(ORGANIZATION_MEMBER_STATUS.suspended)).toBe(false);
        expect(canResendOrganizationInvitation(ORGANIZATION_MEMBER_STATUS.removed)).toBe(false);
    });

    it("enforces the one-minute resend cooldown", () => {
        const now = Date.parse("2026-07-24T12:01:00.000Z");

        expect(isOrganizationInvitationResendCoolingDown(
            "2026-07-24T12:00:30.000Z",
            now,
        )).toBe(true);
        expect(isOrganizationInvitationResendCoolingDown(
            "2026-07-24T12:00:00.000Z",
            now,
        )).toBe(false);
        expect(isOrganizationInvitationResendCoolingDown(null, now)).toBe(false);
    });

    it("builds the shared success message", () => {
        expect(getOrganizationInvitationResendSuccessMessage("paul@example.com")).toBe(
            "Une nouvelle invitation a été envoyée à paul@example.com.",
        );
    });
});
