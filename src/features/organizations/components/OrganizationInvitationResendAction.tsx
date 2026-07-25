import { LoaderCircle, Mail } from "lucide-react";
import {
    ORGANIZATION_INVITATION_RESEND_LABEL,
    canResendOrganizationInvitation,
} from "@/features/organizations/domain/organization-invitation";
import type { OrganizationMemberStatus } from "@/features/organizations/domain/organization-member";
import { Button, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface OrganizationInvitationResendActionProps {
    isDisabled?: boolean;
    isSending: boolean;
    onResend: () => void;
    status: OrganizationMemberStatus;
    userName: string;
}

export function OrganizationInvitationResendAction({
    isDisabled = false,
    isSending,
    onResend,
    status,
    userName,
}: OrganizationInvitationResendActionProps) {
    if (!canResendOrganizationInvitation(status)) {
        return null;
    }

    const accessibleLabel = `${ORGANIZATION_INVITATION_RESEND_LABEL} à ${userName}`;

    return (
        <Button
            aria-label={accessibleLabel}
            className={`${uiTokens.action.iconButtonGhost} disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={isDisabled || isSending}
            onClick={onResend}
            title={ORGANIZATION_INVITATION_RESEND_LABEL}
        >
            <InlineIcon
                icon={isSending ? LoaderCircle : Mail}
                className={`h-5 w-5 ${isSending ? "animate-spin" : ""}`}
            />
        </Button>
    );
}
