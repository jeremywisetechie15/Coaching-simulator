import { AlertTriangle } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DeleteContentConfirmationModalProps {
    busyLabel?: string;
    busy: boolean;
    confirmLabel?: string;
    description?: string;
    entityLabel: string;
    error?: string | null;
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
    title?: string;
    warning?: string;
}

export function DeleteContentConfirmationModal({
    busyLabel = "Suppression...",
    busy,
    confirmLabel = ENTITY_ACTION_LABELS.delete,
    description,
    entityLabel,
    error,
    name,
    onCancel,
    onConfirm,
    title,
    warning,
}: DeleteContentConfirmationModalProps) {
    return (
        <Modal
            className="max-w-[500px]"
            description={description ?? `Confirmez la suppression de ${name}.`}
            onClose={() => {
                if (!busy) onCancel();
            }}
            title={title ?? `${ENTITY_ACTION_LABELS.delete} ${entityLabel}`}
        >
            <Box className="space-y-5">
                <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                    <InlineIcon icon={AlertTriangle} className="mt-0.5 h-5 w-5 shrink-0" />
                    <Text className="text-[13px] font-semibold leading-6">
                        {warning ?? "Cette action est définitive."}
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
                    <Button disabled={busy} onClick={onCancel} className={uiTokens.action.secondaryButton}>
                        Annuler
                    </Button>
                    <Button disabled={busy} onClick={onConfirm} className={uiTokens.action.dangerButton}>
                        {busy ? busyLabel : confirmLabel}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
