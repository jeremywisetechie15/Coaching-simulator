import { resolveInternalHref } from "@/features/app-shell/domain";

export const AUTH_PATHS = {
    callback: "/auth/callback",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    setPassword: "/auth/set-password",
    signIn: "/auth",
} as const;

export const DEFAULT_AUTH_REDIRECT = "/";
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_RECOVERY_TYPE = "recovery" as const;
export const PASSWORD_RECOVERY_PURPOSE = {
    invitation: "invitation",
} as const;

export type PasswordRecoveryPurpose =
    (typeof PASSWORD_RECOVERY_PURPOSE)[keyof typeof PASSWORD_RECOVERY_PURPOSE];

export type PasswordRecoveryIntent =
    | { kind: "invitation"; organizationId: string }
    | { kind: "password_reset" }
    | { kind: "invalid" };

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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolvePasswordRecoveryIntent(searchParams: URLSearchParams): PasswordRecoveryIntent {
    const purpose = searchParams.get("purpose");

    if (!purpose) {
        return { kind: "password_reset" };
    }

    const organizationId = searchParams.get("organization_id");

    if (
        purpose !== PASSWORD_RECOVERY_PURPOSE.invitation
        || !organizationId
        || !uuidPattern.test(organizationId)
    ) {
        return { kind: "invalid" };
    }

    return {
        kind: "invitation",
        organizationId,
    };
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
    const safeRedirect = resolveInternalHref(redirect, DEFAULT_AUTH_REDIRECT);

    if (safeRedirect !== DEFAULT_AUTH_REDIRECT) {
        url.searchParams.set("redirect", safeRedirect);
    }

    if (status) {
        url.searchParams.set("status", status);
    }

    return `${url.pathname}${url.search}`;
}

interface PasswordRecoveryRedirectOptions {
    organizationId?: string;
    purpose?: PasswordRecoveryPurpose;
}

export function buildPasswordRecoveryRedirectUrl(
    origin: string,
    redirect: string,
    options: PasswordRecoveryRedirectOptions = {},
) {
    const callbackUrl = new URL(AUTH_PATHS.callback, origin);
    const safeRedirect = resolveInternalHref(redirect, DEFAULT_AUTH_REDIRECT);

    if (safeRedirect !== DEFAULT_AUTH_REDIRECT) {
        callbackUrl.searchParams.set("redirect", safeRedirect);
    }

    callbackUrl.searchParams.set("flow", PASSWORD_RECOVERY_TYPE);

    if (options.purpose === PASSWORD_RECOVERY_PURPOSE.invitation) {
        if (!options.organizationId || !uuidPattern.test(options.organizationId)) {
            throw new Error("Identifiant d’organisation invalide pour la finalisation d’invitation.");
        }

        callbackUrl.searchParams.set("organization_id", options.organizationId);
        callbackUrl.searchParams.set("purpose", options.purpose);
    }

    return callbackUrl.toString();
}
