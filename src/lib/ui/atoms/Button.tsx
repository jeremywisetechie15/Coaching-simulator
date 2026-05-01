import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function Button({ children, className, type = "button", ...props }: ButtonProps) {
    return (
        <button type={type} className={cn(className)} {...props}>
            {children}
        </button>
    );
}
