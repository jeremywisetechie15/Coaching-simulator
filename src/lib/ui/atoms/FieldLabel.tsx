import type { LabelHTMLAttributes, PropsWithChildren } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type FieldLabelProps = PropsWithChildren<LabelHTMLAttributes<HTMLLabelElement>> & {
    required?: boolean;
};

export function FieldLabel({ children, className, required = false, ...props }: FieldLabelProps) {
    return (
        <label className={cn("block text-[14px] font-semibold text-slate-900", className)} {...props}>
            {children}
            {required && (
                <>
                    {" "}
                    <span aria-hidden="true" className={uiTokens.text.required}>*</span>
                    <span className="sr-only"> (obligatoire)</span>
                </>
            )}
        </label>
    );
}
