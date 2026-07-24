import { validateNewPassword } from "./password-recovery";

export const PASSWORD_CHANGE_MESSAGES = {
    currentPasswordRequired: "Saisissez votre mot de passe actuel.",
    currentPasswordInvalid: "Le mot de passe actuel est incorrect.",
    newPasswordMustDiffer: "Le nouveau mot de passe doit être différent du mot de passe actuel.",
    rateLimited: "Trop de tentatives ont été effectuées. Patientez quelques minutes puis réessayez.",
    sessionExpired: "Votre session a expiré. Reconnectez-vous avant de modifier votre mot de passe.",
    success: "Mot de passe modifié avec succès",
    technical: "Impossible de modifier le mot de passe. Réessayez dans quelques instants.",
    weakPassword: "Ce mot de passe ne respecte pas les exigences de sécurité.",
} as const;

export interface PasswordChangeValues {
    confirmation: string;
    currentPassword: string;
    newPassword: string;
}

interface PasswordChangeErrorLike {
    code?: string | null;
    message?: string | null;
}

export function validatePasswordChange(values: PasswordChangeValues) {
    if (values.currentPassword.length === 0) {
        return PASSWORD_CHANGE_MESSAGES.currentPasswordRequired;
    }

    const newPasswordError = validateNewPassword(values.newPassword, values.confirmation);

    if (newPasswordError) {
        return newPasswordError;
    }

    if (values.currentPassword === values.newPassword) {
        return PASSWORD_CHANGE_MESSAGES.newPasswordMustDiffer;
    }

    return null;
}

export function getPasswordChangeErrorMessage(error: unknown) {
    const errorLike = error as PasswordChangeErrorLike | null;
    const code = errorLike?.code ?? "";
    const message = errorLike?.message?.toLowerCase() ?? "";

    if (
        code === "invalid_credentials"
        || code === "reauthentication_not_valid"
        || message.includes("invalid login credentials")
    ) {
        return PASSWORD_CHANGE_MESSAGES.currentPasswordInvalid;
    }

    if (code === "same_password") {
        return PASSWORD_CHANGE_MESSAGES.newPasswordMustDiffer;
    }

    if (code === "weak_password") {
        return PASSWORD_CHANGE_MESSAGES.weakPassword;
    }

    if (
        code === "session_not_found"
        || code === "refresh_token_not_found"
        || code === "refresh_token_already_used"
        || code === "reauthentication_needed"
    ) {
        return PASSWORD_CHANGE_MESSAGES.sessionExpired;
    }

    if (code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
        return PASSWORD_CHANGE_MESSAGES.rateLimited;
    }

    return PASSWORD_CHANGE_MESSAGES.technical;
}
