"use client";

import { useCallback, useId, useRef, useState, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface TooltipProps extends PropsWithChildren {
    className?: string;
    content: string;
    disabled?: boolean;
}

export function Tooltip({ children, className, content, disabled }: TooltipProps) {
    const tooltipId = useId();
    const anchorRef = useRef<HTMLSpanElement>(null);
    const [position, setPosition] = useState<{ left: number; top: number; placement: "above" | "below" } | null>(null);

    const showTooltip = useCallback(() => {
        const anchor = anchorRef.current;
        if (!anchor) return;

        const bounds = anchor.getBoundingClientRect();
        const viewportPadding = 8;
        const maximumWidth = Math.min(320, window.innerWidth - viewportPadding * 2);
        const left = Math.min(
            Math.max(bounds.left, viewportPadding),
            Math.max(viewportPadding, window.innerWidth - maximumWidth - viewportPadding),
        );
        const placement = bounds.top >= 80 ? "above" : "below";

        setPosition({
            left,
            placement,
            top: placement === "above" ? bounds.top - viewportPadding : bounds.bottom + viewportPadding,
        });
    }, []);

    const hideTooltip = useCallback(() => setPosition(null), []);

    if (disabled || content.trim().length === 0) {
        return <span className={cn("min-w-0", className)}>{children}</span>;
    }

    return (
        <span
            ref={anchorRef}
            aria-describedby={position ? tooltipId : undefined}
            className={cn(uiTokens.tooltip.root, className)}
            title={content}
            onBlurCapture={hideTooltip}
            onFocusCapture={showTooltip}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
            {position && createPortal(
                <span
                    id={tooltipId}
                    className={uiTokens.tooltip.bubble}
                    role="tooltip"
                    style={{
                        left: position.left,
                        top: position.top,
                        transform: position.placement === "above" ? "translateY(-100%)" : undefined,
                    }}
                >
                    {content}
                </span>,
                document.body,
            )}
        </span>
    );
}
