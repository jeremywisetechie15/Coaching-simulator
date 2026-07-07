"use client";

import { AlertTriangle } from "lucide-react";
import { Box, Button, FieldLabel, InlineIcon, Text } from "@/lib/ui/atoms";
import { SingleSelectField } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type { UserAssignedGroup, UserAvailableGroup } from "@/features/users/domain/user-groups";

interface AddUserGroupDialogProps {
    availableGroups: UserAvailableGroup[];
    error: string | null;
    isSubmitting: boolean;
    onClose: () => void;
    onGroupChange: (groupId: string) => void;
    onSubmit: () => void;
    selectedGroupId: string;
}

interface RemoveUserGroupDialogProps {
    error: string | null;
    group: UserAssignedGroup;
    isSubmitting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function AddUserGroupDialog({
    availableGroups,
    error,
    isSubmitting,
    onClose,
    onGroupChange,
    onSubmit,
    selectedGroupId,
}: AddUserGroupDialogProps) {
    const canSubmit = Boolean(selectedGroupId) && !isSubmitting;
    const options = availableGroups.map((group) => ({ label: group.name, value: group.id }));

    return (
        <Modal
            title="Ajouter au groupe"
            description="Sélectionnez un groupe actif de l'organisation dont l'utilisateur ne fait pas encore partie."
            onClose={onClose}
            className="max-w-[520px]"
        >
            <Box className="space-y-5">
                {availableGroups.length > 0 ? (
                    <Box>
                        <FieldLabel className={uiTokens.form.label}>Groupe</FieldLabel>
                        <SingleSelectField
                            disabled={isSubmitting}
                            onChange={onGroupChange}
                            options={options}
                            placeholder="Sélectionner un groupe"
                            value={selectedGroupId}
                        />
                    </Box>
                ) : (
                    <Box className={cn(uiTokens.surface.emptyState, "px-5 py-8")}>
                        <Text className={cn("text-[14px] font-bold", uiTokens.text.heading)}>
                            Aucun groupe disponible
                        </Text>
                        <Text className={cn("mt-2 text-[13px] font-semibold", uiTokens.text.muted)}>
                            {"Tous les groupes actifs de l'organisation sont déjà assignés à cet utilisateur."}
                        </Text>
                    </Box>
                )}

                {error && (
                    <Box
                        aria-live="polite"
                        className={cn("rounded-lg border px-4 py-3 text-[13px] font-semibold", uiTokens.tone.danger.soft)}
                    >
                        {error}
                    </Box>
                )}

                <Box className="grid gap-3 sm:grid-cols-2">
                    <Button
                        disabled={isSubmitting}
                        onClick={onClose}
                        className={uiTokens.action.secondaryButton}
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={!canSubmit}
                        onClick={onSubmit}
                        className={cn(
                            "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition disabled:cursor-not-allowed",
                            canSubmit ? uiTokens.action.primaryButton : uiTokens.action.primaryButtonDisabled,
                        )}
                    >
                        {isSubmitting ? "Ajout..." : "Ajouter"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}

export function RemoveUserGroupDialog({
    error,
    group,
    isSubmitting,
    onClose,
    onConfirm,
}: RemoveUserGroupDialogProps) {
    return (
        <Modal
            title="Retirer du groupe"
            description={`Confirmez le retrait de l'utilisateur du groupe ${group.name}.`}
            onClose={onClose}
            className="max-w-[500px]"
        >
            <Box className="space-y-5">
                <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                    <InlineIcon icon={AlertTriangle} className="mt-0.5 h-5 w-5 shrink-0" />
                    <Text className="text-[13px] font-semibold leading-6">
                        {"Cette action retire uniquement l'appartenance au groupe. L'utilisateur reste membre de son organisation."}
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
                    <Button
                        disabled={isSubmitting}
                        onClick={onClose}
                        className={uiTokens.action.secondaryButton}
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={isSubmitting}
                        onClick={onConfirm}
                        className={uiTokens.action.dangerButton}
                    >
                        {isSubmitting ? "Retrait..." : "Retirer"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
