"use client";

import type { UserContentAssignmentCandidate } from "@/features/users/domain";
import { Box, Button, FieldLabel, Text } from "@/lib/ui/atoms";
import { SingleSelectField } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type UserAssignableContentKind = "quiz" | "roleplay";

interface UserContentAssignmentDialogProps {
    candidates: UserContentAssignmentCandidate[];
    error: string | null;
    isLoading: boolean;
    isSubmitting: boolean;
    kind: UserAssignableContentKind;
    onClose: () => void;
    onContentChange: (contentId: string) => void;
    onSubmit: () => void;
    selectedContentId: string;
}

const labelsByKind = {
    quiz: {
        empty: "Tous les quiz publiés et actifs sont déjà affectés directement à cet utilisateur.",
        label: "Quiz",
        loading: "Chargement des quiz assignables…",
        title: "Assigner un quiz",
    },
    roleplay: {
        empty: "Tous les roleplays publiés et actifs sont déjà affectés directement à cet utilisateur.",
        label: "Roleplay",
        loading: "Chargement des roleplays assignables…",
        title: "Assigner un roleplay",
    },
} satisfies Record<UserAssignableContentKind, Record<string, string>>;

export function UserContentAssignmentDialog({
    candidates,
    error,
    isLoading,
    isSubmitting,
    kind,
    onClose,
    onContentChange,
    onSubmit,
    selectedContentId,
}: UserContentAssignmentDialogProps) {
    const labels = labelsByKind[kind];
    const selectedCandidate = candidates.find((candidate) => candidate.id === selectedContentId);
    const canSubmit = Boolean(selectedContentId) && !isLoading && !isSubmitting;

    return (
        <Modal
            className="max-w-[560px]"
            description="L’affectation est ajoutée sans modifier la visibilité ni les destinataires actuels du contenu."
            onClose={() => {
                if (!isSubmitting) onClose();
            }}
            title={labels.title}
        >
            <Box className="space-y-5">
                {isLoading ? (
                    <Box className={cn(uiTokens.surface.emptyState, "px-5 py-8")} aria-live="polite">
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                            {labels.loading}
                        </Text>
                    </Box>
                ) : candidates.length > 0 ? (
                    <Box className="space-y-2">
                        <FieldLabel className={uiTokens.form.label}>{labels.label}</FieldLabel>
                        <SingleSelectField
                            disabled={isSubmitting}
                            onChange={onContentChange}
                            options={candidates.map((candidate) => ({
                                label: candidate.title,
                                value: candidate.id,
                            }))}
                            placeholder={`Sélectionner un ${kind}`}
                            value={selectedContentId}
                        />
                        {selectedCandidate?.description && (
                            <Text className={cn("text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                                {selectedCandidate.description}
                            </Text>
                        )}
                    </Box>
                ) : (
                    <Box className={cn(uiTokens.surface.emptyState, "px-5 py-8")}>
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                            {labels.empty}
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
                        className={uiTokens.action.secondaryButton}
                        disabled={isSubmitting}
                        onClick={onClose}
                    >
                        Annuler
                    </Button>
                    <Button
                        className={cn(
                            "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition disabled:cursor-not-allowed",
                            canSubmit ? uiTokens.action.primaryButton : uiTokens.action.primaryButtonDisabled,
                        )}
                        disabled={!canSubmit}
                        onClick={onSubmit}
                    >
                        {isSubmitting ? "Affectation…" : "Assigner"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
