"use client";

import { useState } from "react";
import { Archive, ArrowLeft, Edit3 } from "lucide-react";
import { Box, Button, InlineIcon } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { ContextualBackLink } from "./ContextualBackLink";
import { ContextualLink } from "./ContextualLink";

interface ResourceArchiveAction {
    errorMessage: string;
    isArchived?: boolean;
    onArchive: () => Promise<void>;
}

interface ResourceDetailHeaderProps {
    archiveAction?: ResourceArchiveAction;
    canManage?: boolean;
    editHref?: string;
    fallbackHref: string;
}

export function ResourceDetailHeader({
    archiveAction,
    canManage = false,
    editHref,
    fallbackHref,
}: ResourceDetailHeaderProps) {
    const [archiveError, setArchiveError] = useState<string | null>(null);
    const [confirmationPending, setConfirmationPending] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    async function handleArchive() {
        if (!archiveAction || archiveAction.isArchived || isArchiving) return;

        if (!confirmationPending) {
            setArchiveError(null);
            setConfirmationPending(true);
            return;
        }

        setArchiveError(null);
        setIsArchiving(true);

        try {
            await archiveAction.onArchive();
        } catch (error) {
            setArchiveError(
                error instanceof Error ? error.message : archiveAction.errorMessage,
            );
            setConfirmationPending(false);
        } finally {
            setIsArchiving(false);
        }
    }

    return (
        <>
            <Box className={uiTokens.resourceDetailHeader.root}>
                <ContextualBackLink
                    fallbackHref={fallbackHref}
                    showLabel
                    className={uiTokens.resourceDetailHeader.backLink}
                >
                    <InlineIcon
                        icon={ArrowLeft}
                        className={uiTokens.resourceDetailHeader.icon}
                    />
                </ContextualBackLink>

                {canManage && (editHref || archiveAction) && (
                    <Box className={uiTokens.resourceDetailHeader.actions}>
                        {editHref && (
                            <ContextualLink
                                href={editHref}
                                className={uiTokens.resourceDetailHeader.editButton}
                            >
                                <InlineIcon
                                    icon={Edit3}
                                    className={uiTokens.resourceDetailHeader.icon}
                                />
                                Modifier
                            </ContextualLink>
                        )}
                        {archiveAction && (
                            <Button
                                disabled={archiveAction.isArchived || isArchiving}
                                onClick={() => void handleArchive()}
                                className={cn(
                                    uiTokens.resourceDetailHeader.archiveButton,
                                    confirmationPending
                                        && uiTokens.resourceDetailHeader.archiveButtonConfirm,
                                )}
                            >
                                <InlineIcon
                                    icon={Archive}
                                    className={uiTokens.resourceDetailHeader.icon}
                                />
                                {archiveAction.isArchived
                                    ? "Archivée"
                                    : isArchiving
                                      ? "Archivage..."
                                      : confirmationPending
                                        ? "Confirmer l'archivage"
                                        : "Archiver"}
                            </Button>
                        )}
                    </Box>
                )}
            </Box>

            {archiveError && (
                <Box className={uiTokens.resourceDetailHeader.alert}>
                    <AlertMessage message={archiveError} />
                </Box>
            )}
        </>
    );
}
