import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type IconButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function IconButton({ children, className, type = "button", ...props }: IconButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
