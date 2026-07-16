import { Archive } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ArchiveContentConfirmationModalProps {
    busy: boolean;
    entityLabel: string;
    error?: string | null;
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export function ArchiveContentConfirmationModal({
    busy,
    entityLabel,
    error,
    name,
    onCancel,
    onConfirm,
}: ArchiveContentConfirmationModalProps) {
    return (
        <Modal
            className="max-w-[500px]"
            description={`Confirmez l'archivage de ${name}.`}
            onClose={() => {
                if (!busy) onCancel();
            }}
            title={`${ENTITY_ACTION_LABELS.archive} ${entityLabel}`}
        >
            <Box className="space-y-5">
                <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                    <InlineIcon icon={Archive} className="mt-0.5 h-5 w-5 shrink-0" />
                    <Text className="text-[13px] font-semibold leading-6">
                        L&apos;élément ne sera plus visible dans les listes. Les résultats et historiques existants
                        restent conservés.
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
                        {busy ? "Archivage..." : ENTITY_ACTION_LABELS.archive}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
