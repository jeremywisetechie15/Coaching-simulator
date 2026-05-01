import type { PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface CardSurfaceProps extends PropsWithChildren {
    className?: string;
}

export function CardSurface({ children, className }: CardSurfaceProps) {
    return <section className={cn("w-full bg-white", className)}>{children}</section>;
}
