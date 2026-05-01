import type { LabelHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type FieldLabelProps = PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>>;

export function FieldLabel({ children, className, ...props }: FieldLabelProps) {
    return (
        <label className={cn("block text-[14px] font-semibold text-slate-900", className)} {...props}>
            {children}
        </label>
    );
}
