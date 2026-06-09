import type { SelectHTMLAttributes } from "react";
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
                "w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition focus:border-[#5140F0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5140F0]/10",
                densityClasses[density],
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}
