"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useContextualReturn } from "./useContextualNavigation";

interface ContextualBackLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
    fallbackHref: string;
    showLabel?: boolean;
}

export function ContextualBackLink({
    children,
    fallbackHref,
    showLabel = false,
    "aria-label": ariaLabel,
    ...props
}: ContextualBackLinkProps) {
    const { href, label } = useContextualReturn(fallbackHref);
    const resolvedAriaLabel =
        showLabel || (typeof ariaLabel === "string" && ariaLabel.startsWith("Retour"))
            ? label
            : ariaLabel;

    return (
        <Link href={href} aria-label={resolvedAriaLabel} {...props}>
            {children}
            {showLabel ? label : null}
        </Link>
    );
}
