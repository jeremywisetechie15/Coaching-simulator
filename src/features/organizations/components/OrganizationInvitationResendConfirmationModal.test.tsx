import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    ORGANIZATION_INVITATION_RESEND_BUSY_LABEL,
    ORGANIZATION_INVITATION_RESEND_CONFIRMATION_MESSAGE,
    ORGANIZATION_INVITATION_RESEND_LABEL,
} from "@/features/organizations/domain/organization-invitation";
import { OrganizationInvitationResendConfirmationModal } from "./OrganizationInvitationResendConfirmationModal";

describe("OrganizationInvitationResendConfirmationModal", () => {
    it("identifies the recipient and requires an explicit confirmation", () => {
        const html = renderToStaticMarkup(
            <OrganizationInvitationResendConfirmationModal
                isSending={false}
                onCancel={() => undefined}
                onConfirm={() => undefined}
                organizationName="Alpha"
                userEmail="paul@example.com"
                userName="Paul Martin"
            />,
        );

        expect(html).toContain(ORGANIZATION_INVITATION_RESEND_LABEL);
        expect(html).toContain(ORGANIZATION_INVITATION_RESEND_CONFIRMATION_MESSAGE);
        expect(html).toContain("pour Alpha");
        expect(html).toContain("paul@example.com");
        expect(html).toContain("Confirmez le renvoi à Paul Martin.");
        expect(html).toContain("Annuler");
    });

    it("locks both actions while the invitation is being sent", () => {
        const html = renderToStaticMarkup(
            <OrganizationInvitationResendConfirmationModal
                isSending
                onCancel={() => undefined}
                onConfirm={() => undefined}
                userEmail="paul@example.com"
                userName="Paul Martin"
            />,
        );

        expect(html).toContain(ORGANIZATION_INVITATION_RESEND_BUSY_LABEL);
        expect(html.match(/disabled=""/g)).toHaveLength(2);
    });
});
