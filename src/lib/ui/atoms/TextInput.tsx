import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    hasLeadingIcon?: boolean;
    hasTrailingAction?: boolean;
    /** "sm" pour les formulaires denses, "md" par défaut. */
    density?: "sm" | "md";
}

const densityClasses = {
    sm: "h-9 text-[13px]",
    md: "h-11 text-[15px]",
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
                "w-full rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition placeholder:text-slate-400 focus:border-[#5140F0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5140F0]/10",
                densityClasses[density],
                hasLeadingIcon ? "pl-11" : "pl-4",
                hasTrailingAction ? "pr-[52px]" : "pr-4",
                className
            )}
            {...props}
        />
    );
}
