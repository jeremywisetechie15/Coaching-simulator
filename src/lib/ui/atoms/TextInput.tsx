import type { InputHTMLAttributes } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    hasLeadingIcon?: boolean;
    hasTrailingAction?: boolean;
    /** "sm" pour les formulaires denses, "md" par défaut. */
    density?: "sm" | "md";
}

const densityClasses = {
    sm: "h-9 text-[13px]",
    md: "h-9 text-[14px]",
} as const;

export function TextInput({
    className,
    hasLeadingIcon = true,
    hasTrailingAction = false,
    density = "md",
    ...props
}: TextInputProps) {
    return (
        <input
            className={cn(
                uiTokens.form.control,
                densityClasses[density],
                hasLeadingIcon ? "pl-11" : "pl-4",
                hasTrailingAction ? "pr-[52px]" : "pr-4",
                className
            )}
            {...props}
        />
    );
}
