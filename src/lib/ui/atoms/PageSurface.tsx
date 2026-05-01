import type { PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface PageSurfaceProps extends PropsWithChildren {
    className?: string;
}

export function PageSurface({ children, className }: PageSurfaceProps) {
    return <main className={cn("min-h-screen", className)}>{children}</main>;
}
