import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

type TextElement = "h1" | "h2" | "h3" | "p" | "span";

interface TextProps<T extends TextElement = "p"> extends PropsWithChildren {
    as?: T;
    className?: string;
}

export function Text<T extends TextElement = "p">({
    as,
    children,
    className,
    ...props
}: TextProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TextProps<T>>) {
    const Component = (as ?? "p") as ElementType;

    return (
        <Component className={cn(className)} {...props}>
            {children}
        </Component>
    );
}
