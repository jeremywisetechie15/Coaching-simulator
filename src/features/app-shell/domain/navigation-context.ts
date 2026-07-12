const INTERNAL_URL_BASE = "https://maiacoach.local";

export const NAVIGATION_RETURN_TO_PARAM = "returnTo";

const DEFAULT_BACK_LABEL = "Retour à la page précédente";

const unsafeInternalHrefPattern = /[\\\u0000-\u001F\u007F]/;

function toInternalUrl(value: string) {
    return new URL(value, INTERNAL_URL_BASE);
}

function toRelativeHref(url: URL) {
    return `${url.pathname}${url.search}${url.hash}`;
}

export function isSafeInternalHref(value: string | null | undefined): value is string {
    if (
        !value ||
        value !== value.trim() ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        unsafeInternalHrefPattern.test(value)
    ) {
        return false;
    }

    try {
        return toInternalUrl(value).origin === INTERNAL_URL_BASE;
    } catch {
        return false;
    }
}

export function resolveInternalHref(
    value: string | null | undefined,
    fallbackHref: string,
) {
    if (isSafeInternalHref(value)) {
        return value;
    }

    return isSafeInternalHref(fallbackHref) ? fallbackHref : "/";
}

export function getContextualBackLabel(href: string) {
    if (!isSafeInternalHref(href)) {
        return DEFAULT_BACK_LABEL;
    }

    const url = toInternalUrl(href);
    const { pathname, searchParams } = url;
    const segments = pathname.split("/").filter(Boolean);

    if (pathname === "/") return "Retour au tableau de bord";

    if (segments[0] === "roleplays") {
        if (segments[1] === "history") {
            if (segments[2]) return "Retour à la session";
            return searchParams.has("scenario_id")
                ? "Retour à l'historique du scénario"
                : "Retour à l'historique des sessions";
        }

        if (segments[1]) {
            if (segments[2] === "progress") return "Retour au détail de progression";
            if (segments[2] === "session") return "Retour à la simulation";
            if (segments[2] === "steps") {
                if (segments[3]) return "Retour à l'étape d'entraînement";
                return searchParams.get("coach") === "after"
                    ? "Retour au plan de progrès"
                    : "Retour aux étapes du scénario";
            }
            if (searchParams.get("panel") === "quizzes") return "Retour aux évaluations du scénario";
            if (searchParams.get("panel") === "documents") return "Retour aux ressources du scénario";
            return "Retour au scénario";
        }

        return "Retour aux roleplays";
    }

    if (segments[0] === "evaluations") {
        if (segments[1]) {
            return segments[2] === "quiz" ? "Retour au quiz" : "Retour à l'évaluation";
        }
        return "Retour aux évaluations";
    }

    if (segments[0] === "methods") {
        return segments[1] ? "Retour à la méthode" : "Retour aux méthodes";
    }

    if (segments[0] === "scorecards") {
        return segments[1] ? "Retour à la scorecard" : "Retour aux scorecards";
    }

    if (segments[0] === "skills") {
        return segments[1] ? "Retour à la compétence" : "Retour aux compétences";
    }

    if (segments[0] === "organizations") {
        if (segments[2] === "groups" && segments[3]) return "Retour au groupe";
        return segments[1] ? "Retour à l'organisation" : "Retour aux organisations";
    }

    if (segments[0] === "users") {
        return segments[1] ? "Retour à l'utilisateur" : "Retour aux utilisateurs";
    }

    if (segments[0] === "coaches") {
        return segments[1] ? "Retour au coach IA" : "Retour aux coachs IA";
    }

    if (segments[0] === "personas") {
        return segments[1] ? "Retour au persona IA" : "Retour aux personas IA";
    }

    if (segments[0] === "profile") return "Retour au compte";
    if (segments[0] === "roles-permissions") return "Retour aux rôles et permissions";

    return DEFAULT_BACK_LABEL;
}

export function withReturnTo(destinationHref: string, returnHref: string | null | undefined) {
    if (!isSafeInternalHref(destinationHref) || !isSafeInternalHref(returnHref)) {
        return destinationHref;
    }

    const destination = toInternalUrl(destinationHref);
    destination.searchParams.set(NAVIGATION_RETURN_TO_PARAM, returnHref);

    return toRelativeHref(destination);
}

export function buildPostSaveHref(
    detailHref: string,
    returnHref: string,
    isEditing: boolean,
) {
    return isEditing
        ? resolveInternalHref(returnHref, detailHref)
        : withReturnTo(detailHref, returnHref);
}

export function buildCurrentAppHref(pathname: string, search: string | null | undefined) {
    const safePathname = resolveInternalHref(pathname, "/");
    const normalizedSearch = search?.replace(/^\?/, "").trim();

    return normalizedSearch ? `${safePathname}?${normalizedSearch}` : safePathname;
}

export function buildAuthRedirectHref(destinationHref: string) {
    const safeDestination = resolveInternalHref(destinationHref, "/");

    return `/auth?redirect=${encodeURIComponent(safeDestination)}`;
}

export function withoutSearchParam(href: string, param: string) {
    if (!isSafeInternalHref(href) || !param) {
        return href;
    }

    const url = toInternalUrl(href);
    url.searchParams.delete(param);

    return toRelativeHref(url);
}

export function withSearchParam(href: string, param: string, value: string) {
    return withSearchParams(href, { [param]: value });
}

export function withSearchParams(
    href: string,
    updates: Record<string, string | null | undefined>,
) {
    if (!isSafeInternalHref(href)) {
        return href;
    }

    const url = toInternalUrl(href);

    for (const [param, value] of Object.entries(updates)) {
        if (!param) continue;
        if (value === null || value === undefined || value === "") {
            url.searchParams.delete(param);
        } else {
            url.searchParams.set(param, value);
        }
    }

    return toRelativeHref(url);
}
