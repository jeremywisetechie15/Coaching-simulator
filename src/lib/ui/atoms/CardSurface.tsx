import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type CardSurfaceProps = PropsWithChildren<HTMLAttributes<HTMLElement>>;

export function CardSurface({ children, className, ...props }: CardSurfaceProps) {
    return <section className={cn("w-full bg-white", className)} {...props}>{children}</section>;
}
