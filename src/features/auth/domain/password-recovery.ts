import { resolveInternalHref } from "@/features/app-shell/domain";

export const AUTH_PATHS = {
    callback: "/auth/callback",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    signIn: "/auth",
} as const;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RECOVERY_TYPE = "recovery" as const;

export type PasswordRecoveryCredential =
    | { kind: "pkce"; value: string }
    | { kind: "token_hash"; value: string };

export function resolvePasswordRecoveryCredential(
    searchParams: URLSearchParams,
): PasswordRecoveryCredential | null {
    const hasTokenHashParameters = searchParams.has("token_hash") || searchParams.has("type");
    const tokenHash = searchParams.get("token_hash");

    if (hasTokenHashParameters) {
        if (
            !tokenHash
            || tokenHash !== tokenHash.trim()
            || searchParams.get("type") !== PASSWORD_RECOVERY_TYPE
        ) {
            return null;
        }

        return { kind: "token_hash", value: tokenHash };
    }

    const code = searchParams.get("code");

    if (
        code
        && code === code.trim()
        && searchParams.get("flow") === PASSWORD_RECOVERY_TYPE
    ) {
        return { kind: "pkce", value: code };
    }

    return null;
}

export function validateNewPassword(password: string, confirmation: string) {
    if (password.length < PASSWORD_MIN_LENGTH) {
        return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
    }

    if (password !== confirmation) {
        return "Les mots de passe ne correspondent pas.";
    }

    return null;
}

export function buildAuthPath(path: string, redirect: string, status?: string) {
    const url = new URL(path, "https://maiacoach.local");
    const safeRedirect = resolveInternalHref(redirect, "/profile");

    if (safeRedirect !== "/profile") {
        url.searchParams.set("redirect", safeRedirect);
    }

    if (status) {
        url.searchParams.set("status", status);
    }

    return `${url.pathname}${url.search}`;
}

export function buildPasswordRecoveryRedirectUrl(origin: string, redirect: string) {
    const callbackUrl = new URL(AUTH_PATHS.callback, origin);
    const safeRedirect = resolveInternalHref(redirect, "/profile");

    if (safeRedirect !== "/profile") {
        callbackUrl.searchParams.set("redirect", safeRedirect);
    }

    callbackUrl.searchParams.set("flow", PASSWORD_RECOVERY_TYPE);

    return callbackUrl.toString();
}
