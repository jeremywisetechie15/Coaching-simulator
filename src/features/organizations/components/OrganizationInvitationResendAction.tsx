import { LoaderCircle, Mail } from "lucide-react";
import {
    ORGANIZATION_INVITATION_RESEND_LABEL,
    canResendOrganizationInvitation,
} from "@/features/organizations/domain/organization-invitation";
import type { OrganizationMemberStatus } from "@/features/organizations/domain/organization-member";
import { Button, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface OrganizationInvitationResendActionProps {
    isDisabled?: boolean;
    isSending: boolean;
    onRequestResend: () => void;
    status: OrganizationMemberStatus;
    userName: string;
}

export function OrganizationInvitationResendAction({
    isDisabled = false,
    isSending,
    onRequestResend,
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
            className={uiTokens.organizationDetail.table.action}
            disabled={isDisabled || isSending}
            onClick={onRequestResend}
            title={ORGANIZATION_INVITATION_RESEND_LABEL}
        >
            <InlineIcon
                icon={isSending ? LoaderCircle : Mail}
                className={cn(
                    uiTokens.organizationDetail.table.actionIcon,
                    isSending && uiTokens.organizationDetail.table.actionLoading,
                )}
            />
        </Button>
    );
}
