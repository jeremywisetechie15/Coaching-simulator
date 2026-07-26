import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className, type = "button", ...props }: ButtonProps) {
    return (
        <button type={type} className={cn(uiTokens.interaction.button, className)} {...props}>
            {children}
        </button>
    );
}
