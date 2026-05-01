import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/ui/utils/cn";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
    return (
        <textarea
            className={cn(
                "w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition placeholder:text-slate-400 focus:border-[#5140F0] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5140F0]/10",
                className
            )}
            {...props}
        />
    );
}
