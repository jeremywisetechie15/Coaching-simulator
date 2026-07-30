"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const subscribeToClientRuntime = () => () => undefined;

interface ModalProps {
    children: ReactNode;
    /** Largeur du panneau (ex. "max-w-[520px]"). */
    className?: string;
    description?: string;
    fixedHeader?: boolean;
    headerAside?: ReactNode;
    onClose: () => void;
    title: string;
    titleAside?: ReactNode;
}

/** Fenêtre modale réutilisable : overlay, panneau, en-tête (titre + fermeture). */
export function Modal({
    children,
    className,
    description,
    fixedHeader = false,
    headerAside,
    onClose,
    title,
    titleAside,
}: ModalProps) {
    const canUsePortal = useSyncExternalStore(
        subscribeToClientRuntime,
        () => true,
        () => false,
    );

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    const modalContent = (
        <Box
            className={cn(uiTokens.modal.overlay, uiTokens.motion.modalOverlayReveal)}
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <Box
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    uiTokens.modal.panel,
                    fixedHeader
                        ? uiTokens.modal.panelFixed
                        : uiTokens.modal.panelScrollable,
                    uiTokens.motion.modalPanelReveal,
                    "max-w-[520px]",
                    className,
                )}
            >
                <Box
                    className={cn(
                        uiTokens.modal.header,
                        fixedHeader && uiTokens.modal.headerFixed,
                    )}
                >
                    <Box>
                        <Box className={uiTokens.modal.titleRow}>
                            <Text as="h2" className={cn(uiTokens.modal.title, uiTokens.text.heading)}>
                                {title}
                            </Text>
                            {titleAside}
                        </Box>
                        {description && (
                            <Text className={cn("mt-1 text-[14px] font-medium leading-6", uiTokens.text.muted)}>
                                {description}
                            </Text>
                        )}
                    </Box>
                    <Box className="flex shrink-0 items-start gap-3">
                        {headerAside}
                        <Button aria-label="Fermer" onClick={onClose} className={uiTokens.modal.closeButton}>
                            <InlineIcon icon={X} className="h-5 w-5" />
                        </Button>
                    </Box>
                </Box>
                <Box className={fixedHeader ? uiTokens.modal.contentFixed : undefined}>
                    {children}
                </Box>
            </Box>
        </Box>
    );

    return canUsePortal ? createPortal(modalContent, document.body) : modalContent;
}
