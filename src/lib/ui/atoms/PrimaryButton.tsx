import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type PrimaryButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function PrimaryButton({ children, className, type = "submit", ...props }: PrimaryButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                uiTokens.action.primaryFullButton,
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
