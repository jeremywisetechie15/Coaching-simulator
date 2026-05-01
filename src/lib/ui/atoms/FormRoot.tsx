import type { FormHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type FormRootProps = PropsWithChildren<FormHTMLAttributes<HTMLFormElement>>;

export function FormRoot({ children, className, ...props }: FormRootProps) {
    return (
        <form className={cn("space-y-4", className)} {...props}>
            {children}
        </form>
    );
}
