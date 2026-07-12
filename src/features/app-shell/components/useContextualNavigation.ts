"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
    buildCurrentAppHref,
    getContextualBackLabel,
    NAVIGATION_RETURN_TO_PARAM,
    resolveInternalHref,
} from "@/features/app-shell/domain";

export function useCurrentAppHref() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return buildCurrentAppHref(pathname, searchParams.toString());
}

export function useContextualReturnHref(fallbackHref: string) {
    return useContextualReturn(fallbackHref).href;
}

export function useContextualReturn(fallbackHref: string) {
    const searchParams = useSearchParams();
    const href = resolveInternalHref(searchParams.get(NAVIGATION_RETURN_TO_PARAM), fallbackHref);

    return {
        href,
        label: getContextualBackLabel(href),
    };
}
