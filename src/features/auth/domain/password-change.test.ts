import { describe, expect, it } from "vitest";
import {
    PASSWORD_CHANGE_MESSAGES,
    getPasswordChangeErrorMessage,
    validatePasswordChange,
} from "./password-change";

describe("password change", () => {
    it("requires the current password", () => {
        expect(validatePasswordChange({
            confirmation: "new-password",
            currentPassword: "",
            newPassword: "new-password",
        })).toBe(PASSWORD_CHANGE_MESSAGES.currentPasswordRequired);
    });

    it("reuses the new-password validation rules", () => {
        expect(validatePasswordChange({
            confirmation: "short",
            currentPassword: "current-password",
            newPassword: "short",
        })).toBe("Le mot de passe doit contenir au moins 8 caractères.");

        expect(validatePasswordChange({
            confirmation: "another-password",
            currentPassword: "current-password",
            newPassword: "new-password",
        })).toBe("Les mots de passe ne correspondent pas.");
    });

    it("rejects a new password identical to the current one", () => {
        expect(validatePasswordChange({
            confirmation: "current-password",
            currentPassword: "current-password",
            newPassword: "current-password",
        })).toBe(PASSWORD_CHANGE_MESSAGES.newPasswordMustDiffer);
    });

    it("accepts a valid password change", () => {
        expect(validatePasswordChange({
            confirmation: "new-password",
            currentPassword: "current-password",
            newPassword: "new-password",
        })).toBeNull();
    });

    it.each([
        ["invalid_credentials", PASSWORD_CHANGE_MESSAGES.currentPasswordInvalid],
        ["same_password", PASSWORD_CHANGE_MESSAGES.newPasswordMustDiffer],
        ["weak_password", PASSWORD_CHANGE_MESSAGES.weakPassword],
        ["session_not_found", PASSWORD_CHANGE_MESSAGES.sessionExpired],
        ["over_request_rate_limit", PASSWORD_CHANGE_MESSAGES.rateLimited],
        ["unknown_error", PASSWORD_CHANGE_MESSAGES.technical],
    ])("maps the %s provider error", (code, expectedMessage) => {
        expect(getPasswordChangeErrorMessage({ code })).toBe(expectedMessage);
    });
});
