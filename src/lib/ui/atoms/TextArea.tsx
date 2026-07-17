import { forwardRef, type TextareaHTMLAttributes } from "react";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
    { className, ...props },
    ref,
) {
    return (
        <textarea
            ref={ref}
            className={cn(uiTokens.form.textArea, className)}
            {...props}
        />
    );
});
