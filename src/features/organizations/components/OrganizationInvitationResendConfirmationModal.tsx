"use client";

import { Mail } from "lucide-react";
import {
    ORGANIZATION_INVITATION_RESEND_BUSY_LABEL,
    ORGANIZATION_INVITATION_RESEND_CONFIRMATION_MESSAGE,
    ORGANIZATION_INVITATION_RESEND_LABEL,
} from "@/features/organizations/domain/organization-invitation";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface OrganizationInvitationResendConfirmationModalProps {
    isSending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    organizationName?: string;
    userEmail: string;
    userName: string;
}

const t = uiTokens.organizationInvitation.confirmation;

export function OrganizationInvitationResendConfirmationModal({
    isSending,
    onCancel,
    onConfirm,
    organizationName,
    userEmail,
    userName,
}: OrganizationInvitationResendConfirmationModalProps) {
    const organizationContext = organizationName ? ` pour ${organizationName}` : "";

    return (
        <Modal
            className={t.panel}
            description={`Une nouvelle invitation${organizationContext} sera envoyée à ${userEmail}.`}
            onClose={() => {
                if (!isSending) onCancel();
            }}
            title={ORGANIZATION_INVITATION_RESEND_LABEL}
        >
            <Box className={t.body}>
                <Box className={cn(t.callout, uiTokens.tone.info.soft)}>
                    <InlineIcon icon={Mail} className={t.calloutIcon} />
                    <Text className={t.calloutText}>
                        {ORGANIZATION_INVITATION_RESEND_CONFIRMATION_MESSAGE}
                        <br />
                        Confirmez le renvoi à {userName}.
                    </Text>
                </Box>

                <Box className={t.actions}>
                    <Button
                        disabled={isSending}
                        onClick={onCancel}
                        className={uiTokens.action.secondaryButton}
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isSending}
                        onClick={onConfirm}
                        className={cn(t.confirmButton, uiTokens.action.primaryButton)}
                    >
                        <InlineIcon icon={Mail} className={t.confirmIcon} />
                        {isSending
                            ? ORGANIZATION_INVITATION_RESEND_BUSY_LABEL
                            : ORGANIZATION_INVITATION_RESEND_LABEL}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
