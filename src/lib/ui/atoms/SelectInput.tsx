import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/ui/utils/cn";

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement>;

export function SelectInput({ children, className, ...props }: SelectInputProps) {
    return (
        <select
            className={cn(
                "h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-[15px] font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition focus:border-[#5140F0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5140F0]/10",
                className
            )}
            {...props}
        >
            {children}
        </select>
    );
}
