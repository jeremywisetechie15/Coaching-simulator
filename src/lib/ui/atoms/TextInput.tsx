import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
    hasLeadingIcon?: boolean;
    hasTrailingAction?: boolean;
}

export function TextInput({
    className,
    hasLeadingIcon = true,
    hasTrailingAction = false,
    ...props
}: TextInputProps) {
    return (
        <input
            className={cn(
                "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition placeholder:text-slate-400 focus:border-[#5140F0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5140F0]/10",
                hasLeadingIcon ? "pl-11" : "pl-4",
                hasTrailingAction ? "pr-[52px]" : "pr-4",
                className
            )}
            {...props}
        />
    );
}
