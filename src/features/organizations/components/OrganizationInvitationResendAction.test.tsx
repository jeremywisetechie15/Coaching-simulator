import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { OrganizationInvitationResendAction } from "./OrganizationInvitationResendAction";

describe("OrganizationInvitationResendAction", () => {
    it("renders the action for an invited membership", () => {
        const html = renderToStaticMarkup(
            <OrganizationInvitationResendAction
                isSending={false}
                onResend={() => undefined}
                status={ORGANIZATION_MEMBER_STATUS.invited}
                userName="Paul Martin"
            />,
        );

        expect(html).toContain("Renvoyer l’invitation à Paul Martin");
    });

    it.each([
        ORGANIZATION_MEMBER_STATUS.active,
        ORGANIZATION_MEMBER_STATUS.suspended,
        ORGANIZATION_MEMBER_STATUS.removed,
    ])("does not render the action for the %s status", (status) => {
        const html = renderToStaticMarkup(
            <OrganizationInvitationResendAction
                isSending={false}
                onResend={() => undefined}
                status={status}
                userName="Paul Martin"
            />,
        );

        expect(html).toBe("");
    });
});
