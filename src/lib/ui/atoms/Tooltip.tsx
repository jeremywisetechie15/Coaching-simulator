import type { PropsWithChildren } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface TooltipProps extends PropsWithChildren {
    className?: string;
    content: string;
    disabled?: boolean;
}

export function Tooltip({ children, className, content, disabled }: TooltipProps) {
    if (disabled || content.trim().length === 0) {
        return <span className={cn("min-w-0", className)}>{children}</span>;
    }

    return (
        <span className={cn(uiTokens.tooltip.root, className)} title={content}>
            {children}
            <span className={uiTokens.tooltip.bubble} role="tooltip">
                {content}
            </span>
        </span>
    );
}
