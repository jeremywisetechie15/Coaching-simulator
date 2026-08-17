"use client";

import { AlertTriangle } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface HistoricalImpactConfirmationModalProps {
    busy: boolean;
    description: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    title: string;
}

export function HistoricalImpactConfirmationModal({
    busy,
    description,
    message,
    onCancel,
    onConfirm,
    title,
}: HistoricalImpactConfirmationModalProps) {
    return (
        <Modal
            className="max-w-[520px]"
            description={description}
            onClose={() => {
                if (!busy) onCancel();
            }}
            title={title}
        >
            <Box className="space-y-5">
                <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                    <InlineIcon icon={AlertTriangle} className="mt-0.5 h-5 w-5 shrink-0" />
                    <Text className="text-[13px] font-semibold leading-6">
                        {message}
                    </Text>
                </Box>

                <Box className="grid gap-3 sm:grid-cols-2">
                    <Button disabled={busy} onClick={onCancel} className={uiTokens.action.secondaryButton}>
                        Annuler
                    </Button>
                    <Button disabled={busy} onClick={onConfirm} className={uiTokens.action.primaryButton}>
                        {busy ? "Enregistrement..." : "Confirmer et enregistrer"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
