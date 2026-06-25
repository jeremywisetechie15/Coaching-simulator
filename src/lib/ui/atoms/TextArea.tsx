import type { TextareaHTMLAttributes } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
    return (
        <textarea
            className={cn(
                uiTokens.form.textArea,
                className
            )}
            {...props}
        />
    );
}
