import type { PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface StackProps extends PropsWithChildren {
    className?: string;
}

export function Stack({ children, className }: StackProps) {
    return <div className={cn(className)}>{children}</div>;
}
