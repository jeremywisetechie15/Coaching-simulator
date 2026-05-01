import type { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from "react";
import { cn } from "@/lib/ui/utils/cn";

interface BoxOwnProps<T extends ElementType> extends PropsWithChildren {
    as?: T;
    className?: string;
}

export type BoxProps<T extends ElementType> = BoxOwnProps<T> &
    Omit<ComponentPropsWithoutRef<T>, keyof BoxOwnProps<T>>;

export function Box<T extends ElementType = "div">({
    as,
    children,
    className,
    ...props
}: BoxProps<T>) {
    const Component = as ?? "div";

    return (
        <Component className={cn(className)} {...props}>
            {children}
        </Component>
    );
}
