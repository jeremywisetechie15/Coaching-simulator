import { describe, expect, it } from "vitest";
import {
    AUTH_PATHS,
    buildAuthPath,
    buildPasswordRecoveryRedirectUrl,
    resolvePasswordRecoveryCredential,
    validateNewPassword,
} from "./password-recovery";

describe("password recovery", () => {
    it("validates password length and confirmation", () => {
        expect(validateNewPassword("short", "short")).toBe(
            "Le mot de passe doit contenir au moins 8 caractères.",
        );
        expect(validateNewPassword("password-valid", "different-password")).toBe(
            "Les mots de passe ne correspondent pas.",
        );
        expect(validateNewPassword("password-valid", "password-valid")).toBeNull();
    });

    it("preserves only internal post-login redirects", () => {
        expect(buildAuthPath(AUTH_PATHS.forgotPassword, "/roleplays")).toBe(
            "/auth/forgot-password?redirect=%2Froleplays",
        );
        expect(buildAuthPath(AUTH_PATHS.forgotPassword, "https://malicious.example")).toBe(
            "/auth/forgot-password",
        );
    });

    it("builds the recovery callback URL for the current deployment origin", () => {
        const url = new URL(
            buildPasswordRecoveryRedirectUrl("https://staging.maiacoach.fr", "/evaluations"),
        );

        expect(url.origin).toBe("https://staging.maiacoach.fr");
        expect(url.pathname).toBe("/auth/callback");
        expect(url.searchParams.get("flow")).toBe("recovery");
        expect(url.searchParams.get("redirect")).toBe("/evaluations");
    });

    it("prioritizes a valid token hash and rejects mixed invalid recovery parameters", () => {
        expect(resolvePasswordRecoveryCredential(new URLSearchParams(
            "token_hash=secure-token&type=recovery&code=pkce-code&flow=recovery",
        ))).toEqual({ kind: "token_hash", value: "secure-token" });

        expect(resolvePasswordRecoveryCredential(new URLSearchParams(
            "token_hash=secure-token&type=invite&code=pkce-code&flow=recovery",
        ))).toBeNull();
    });

    it.each([
        "type=recovery&code=pkce-code&flow=recovery",
        "token_hash=&type=recovery&code=pkce-code&flow=recovery",
        "token_hash=%20%20%20&type=recovery",
        "token_hash=secure-token",
    ])("rejects an incomplete token-hash callback without falling back to PKCE: %s", (search) => {
        expect(resolvePasswordRecoveryCredential(new URLSearchParams(search))).toBeNull();
    });
});
