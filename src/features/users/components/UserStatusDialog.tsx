"use client";

import { AlertTriangle, UserCheck, UserX } from "lucide-react";
import {
    USER_STATUS_ACTION,
    USER_STATUS_ACTION_LABELS,
    type UserStatusAction,
} from "@/features/users/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface UserStatusDialogProps {
    action: UserStatusAction;
    error: string | null;
    isSubmitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
}

export function UserStatusDialog({
    action,
    error,
    isSubmitting,
    onClose,
    onConfirm,
    userName,
}: UserStatusDialogProps) {
    const isSuspension = action === USER_STATUS_ACTION.suspend;
    const label = USER_STATUS_ACTION_LABELS[action];

    return (
        <Modal
            className="max-w-[500px]"
            description={`${label} le compte de ${userName}.`}
            onClose={() => {
                if (!isSubmitting) onClose();
            }}
            title={`${label} l’utilisateur`}
        >
            <Box className="space-y-5">
                <Box
                    className={cn(
                        "flex gap-3 rounded-xl border p-4",
                        isSuspension ? uiTokens.tone.warning.soft : uiTokens.tone.info.soft,
                    )}
                >
                    <InlineIcon
                        icon={isSuspension ? AlertTriangle : UserCheck}
                        className="mt-0.5 h-5 w-5 shrink-0"
                    />
                    <Text className="text-[13px] font-semibold leading-6">
                        {isSuspension
                            ? "L’utilisateur sera déconnecté et ne pourra plus accéder à l’application jusqu’à sa réactivation."
                            : "L’utilisateur pourra de nouveau se connecter et accéder aux contenus de son organisation."}
                    </Text>
                </Box>

                {error && (
                    <Box
                        aria-live="polite"
                        className={cn("rounded-lg border px-4 py-3 text-[13px] font-semibold", uiTokens.tone.danger.soft)}
                    >
                        {error}
                    </Box>
                )}

                <Box className="grid gap-3 sm:grid-cols-2">
                    <Button disabled={isSubmitting} onClick={onClose} className={uiTokens.action.secondaryButton}>
                        Annuler
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className={cn(
                            "flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70",
                            isSuspension ? uiTokens.action.dangerButton : uiTokens.action.primaryButton,
                        )}
                    >
                        <InlineIcon icon={isSuspension ? UserX : UserCheck} className="h-4 w-4" />
                        {isSubmitting ? `${label}...` : label}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
