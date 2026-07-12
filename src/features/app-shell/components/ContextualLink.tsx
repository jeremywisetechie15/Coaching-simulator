"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { withReturnTo } from "@/features/app-shell/domain";
import { useCurrentAppHref } from "./useContextualNavigation";

interface ContextualLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
    href: string;
    returnHref?: string;
}

export function ContextualLink({ href, returnHref, ...props }: ContextualLinkProps) {
    const currentHref = useCurrentAppHref();

    return <Link href={withReturnTo(href, returnHref ?? currentHref)} {...props} />;
}
