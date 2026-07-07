import type { SelectHTMLAttributes } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
    /** "sm" pour les formulaires denses, "md" par défaut. */
    density?: "sm" | "md";
}

const densityClasses = {
    sm: "h-9 text-[13px]",
    md: "h-11 text-[15px]",
} as const;

export function SelectInput({ children, className, density = "md", ...props }: SelectInputProps) {
    return (
        <select
            className={cn(
                uiTokens.form.control,
                "appearance-none pr-11",
                densityClasses[density],
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}
