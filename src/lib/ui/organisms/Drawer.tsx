"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DrawerProps {
    children: ReactNode;
    /** Largeur du panneau (ex. "max-w-[480px]"). */
    className?: string;
    description?: string;
    onClose: () => void;
    title: string;
}

/** Panneau latéral réutilisable : overlay, panneau ancré à droite, en-tête (titre + fermeture). */
export function Drawer({ children, className, description, onClose, title }: DrawerProps) {
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
            className={uiTokens.drawer.overlay}
            role="presentation"
            onClick={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <Box role="dialog" aria-modal="true" aria-label={title} className={cn(uiTokens.drawer.panel, className)}>
                <Box className={uiTokens.drawer.header}>
                    <Box>
                        <Text as="h2" className={uiTokens.drawer.title}>
                            {title}
                        </Text>
                        {description && (
                            <Text className="mt-1 text-[13px] font-medium leading-5 text-[#6B7280]">{description}</Text>
                        )}
                    </Box>
                    <Button aria-label="Fermer" onClick={onClose} className={uiTokens.modal.closeButton}>
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>
                <Box className={uiTokens.drawer.body}>{children}</Box>
            </Box>
        </Box>
    );
}
