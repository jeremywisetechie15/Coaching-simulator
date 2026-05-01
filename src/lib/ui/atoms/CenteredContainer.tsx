import type { PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface CenteredContainerProps extends PropsWithChildren {
    className?: string;
}

export function CenteredContainer({ children, className }: CenteredContainerProps) {
    return (
        <div className={cn("mx-auto flex w-full items-center justify-center", className)}>
            {children}
        </div>
    );
}
