"use client";

import { useState } from "react";
import { ArrowLeft, Edit3 } from "lucide-react";
import {
    ContentRemovalButton,
    ContentRemovalConfirmationModal,
} from "@/features/content/components";
import {
    canEditContent,
    getContentRemovalAction,
    type ContentStatus,
} from "@/features/content/domain";
import { Box, InlineIcon } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { ContextualBackLink } from "./ContextualBackLink";
import { ContextualLink } from "./ContextualLink";

interface ResourceRemovalAction {
    entityLabel: string;
    errorMessage: string;
    name: string;
    onRemove: () => Promise<void>;
    status: ContentStatus;
}

interface ResourceDetailHeaderProps {
    canManage?: boolean;
    editHref?: string;
    fallbackHref: string;
    removalAction?: ResourceRemovalAction;
}

export function ResourceDetailHeader({
    canManage = false,
    editHref,
    fallbackHref,
    removalAction,
}: ResourceDetailHeaderProps) {
    const [removalError, setRemovalError] = useState<string | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const removalType = removalAction
        ? getContentRemovalAction(removalAction.status)
        : null;
    const resolvedEditHref = removalAction && !canEditContent(removalAction.status)
        ? undefined
        : editHref;

    async function handleRemove() {
        if (!removalAction || !removalType || isRemoving) return;

        setRemovalError(null);
        setIsRemoving(true);

        try {
            await removalAction.onRemove();
            setIsConfirmationOpen(false);
        } catch (error) {
            setRemovalError(
                error instanceof Error ? error.message : removalAction.errorMessage,
            );
        } finally {
            setIsRemoving(false);
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

                {canManage && (resolvedEditHref || removalType) && (
                    <Box className={uiTokens.resourceDetailHeader.actions}>
                        {resolvedEditHref && (
                            <ContextualLink
                                href={resolvedEditHref}
                                className={uiTokens.resourceDetailHeader.editButton}
                            >
                                <InlineIcon
                                    icon={Edit3}
                                    className={uiTokens.resourceDetailHeader.icon}
                                />
                                Modifier
                            </ContextualLink>
                        )}
                        {removalType && removalAction && (
                            <ContentRemovalButton
                                busy={isRemoving}
                                onClick={() => {
                                    setRemovalError(null);
                                    setIsConfirmationOpen(true);
                                }}
                                status={removalAction.status}
                            />
                        )}
                    </Box>
                )}
            </Box>

            {isConfirmationOpen && removalAction && (
                <ContentRemovalConfirmationModal
                    busy={isRemoving}
                    entityLabel={removalAction.entityLabel}
                    error={removalError}
                    name={removalAction.name}
                    onCancel={() => {
                        if (isRemoving) return;
                        setRemovalError(null);
                        setIsConfirmationOpen(false);
                    }}
                    onConfirm={() => void handleRemove()}
                    status={removalAction.status}
                />
            )}
        </>
    );
}
