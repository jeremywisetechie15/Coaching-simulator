"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { X } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DrawerProps {
    bodyClassName?: string;
    children: ReactNode;
    /** Largeur du panneau (ex. "max-w-[480px]"). */
    className?: string;
    description?: string;
    id?: string;
    initialFocusRef?: RefObject<HTMLElement | null>;
    onClose: () => void;
    title: string;
}

/** Panneau latéral réutilisable : overlay, panneau ancré à droite, en-tête (titre + fermeture). */
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
].join(",");

export function Drawer({
    bodyClassName,
    children,
    className,
    description,
    id,
    initialFocusRef,
    onClose,
    title,
}: DrawerProps) {
    const descriptionId = useId();
    const titleId = useId();
    const onCloseRef = useRef(onClose);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const focusTimer = window.setTimeout(() => {
            const initialElement = initialFocusRef?.current
                ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
                ?? panelRef.current;
            initialElement?.focus();
        }, 0);

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                onCloseRef.current();
                return;
            }

            if (event.key !== "Tab" || !panelRef.current) return;

            const focusableElements = Array.from(
                panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            );
            if (focusableElements.length === 0) {
                event.preventDefault();
                panelRef.current.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        }

        document.addEventListener("keydown", handleKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, [initialFocusRef]);

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
            <div
                id={id}
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={description ? descriptionId : undefined}
                className={cn(uiTokens.drawer.panel, className)}
                tabIndex={-1}
            >
                <Box className={uiTokens.drawer.header}>
                    <Box>
                        <Text id={titleId} as="h2" className={uiTokens.drawer.title}>
                            {title}
                        </Text>
                        {description && (
                            <Text id={descriptionId} className={uiTokens.drawer.description}>
                                {description}
                            </Text>
                        )}
                    </Box>
                    <Button aria-label="Fermer" onClick={onClose} className={uiTokens.modal.closeButton}>
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>
                <Box className={cn(uiTokens.drawer.body, bodyClassName)}>{children}</Box>
            </div>
        </Box>
    );
}
