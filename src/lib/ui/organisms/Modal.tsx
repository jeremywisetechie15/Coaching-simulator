"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ModalProps {
    children: ReactNode;
    /** Largeur du panneau (ex. "max-w-[520px]"). */
    className?: string;
    description?: string;
    onClose: () => void;
    title: string;
}

/** Fenêtre modale réutilisable : overlay, panneau, en-tête (titre + fermeture). */
export function Modal({ children, className, description, onClose, title }: ModalProps) {
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

    return (
        <Box
            className={uiTokens.modal.overlay}
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <Box role="dialog" aria-modal="true" aria-label={title} className={cn(uiTokens.modal.panel, "max-w-[520px]", className)}>
                <Box className="mb-5 flex items-start justify-between gap-4">
                    <Box>
                        <Text as="h2" className={cn(uiTokens.modal.title, uiTokens.text.heading)}>
                            {title}
                        </Text>
                        {description && (
                            <Text className={cn("mt-1 text-[14px] font-medium leading-6", uiTokens.text.muted)}>
                                {description}
                            </Text>
                        )}
                    </Box>
                    <Button aria-label="Fermer" onClick={onClose} className={uiTokens.modal.closeButton}>
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>
                {children}
            </Box>
        </Box>
    );
}
