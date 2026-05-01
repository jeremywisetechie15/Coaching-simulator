import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type PrimaryButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>;

export function PrimaryButton({ children, className, type = "submit", ...props }: PrimaryButtonProps) {
    return (
        <button
            type={type}
            className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5140F0] text-[15px] font-bold text-white shadow-[0_16px_30px_rgba(81,64,240,0.22)] transition hover:bg-[#4735EA] disabled:cursor-not-allowed disabled:opacity-70",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
