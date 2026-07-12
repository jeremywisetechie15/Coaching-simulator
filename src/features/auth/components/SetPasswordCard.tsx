"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { resolveInternalHref } from "@/features/app-shell/domain";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/features/auth/domain/password-recovery";
import { FormRoot } from "@/lib/ui/atoms";
import { AlertMessage, PasswordField, SubmitButton } from "@/lib/ui/molecules";
import { AuthCardFrame } from "./AuthCardFrame";

const expiredInvitationMessage = "Lien d'invitation expiré ou déjà utilisé. Demandez une nouvelle invitation.";

function getAuthHashErrorMessage() {
    if (typeof window === "undefined" || !window.location.hash) {
        return null;
    }

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorCode = hashParams.get("error_code");
    const errorDescription = hashParams.get("error_description");

    if (errorCode === "otp_expired") {
        return expiredInvitationMessage;
    }

    if (errorCode || errorDescription) {
        return errorDescription ?? "Lien d'authentification invalide.";
    }

    return null;
}

export function SetPasswordCard() {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(
        () => resolveInternalHref(searchParams.get("redirect"), "/profile"),
        [searchParams],
    );
    const organizationId = searchParams.get("organization_id");
    const tokenHash = searchParams.get("token_hash");
    const otpType = searchParams.get("type");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(() => getAuthHashErrorMessage());

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const authHashError = getAuthHashErrorMessage();

        if (authHashError) {
            setError(authHashError);
            return;
        }

        setError(null);

        const validationError = validateNewPassword(password, confirmPassword);

        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);

        const supabase = createClient();

        if (tokenHash) {
            if (otpType !== "invite") {
                setIsSubmitting(false);
                setError("Lien d'invitation invalide. Demandez une nouvelle invitation.");
                return;
            }

            const { error: verifyError } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: otpType as EmailOtpType,
            });

            if (verifyError) {
                setIsSubmitting(false);
                setError(expiredInvitationMessage);
                return;
            }
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        setIsSubmitting(false);

        if (updateError) {
            setError(expiredInvitationMessage);
            return;
        }

        const activationResponse = await fetch("/api/auth/activate-membership", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...(organizationId ? { organizationId } : {}),
            }),
        });

        if (!activationResponse.ok) {
            setError("Mot de passe créé, mais l'activation de l'organisation a échoué. Contactez un administrateur.");
            return;
        }

        window.location.assign(redirectTo);
    };

    return (
        <AuthCardFrame
            title="Créer votre mot de passe"
            description="Définissez un mot de passe pour activer votre compte"
        >
            <FormRoot onSubmit={handleSubmit}>
                <PasswordField
                    autoComplete="new-password"
                    id="password"
                    name="password"
                    label="Mot de passe"
                    value={password}
                    isVisible={isPasswordVisible}
                    onChange={(event) => setPassword(event.target.value)}
                    onToggleVisibility={() => setIsPasswordVisible((value) => !value)}
                />
                <PasswordField
                    autoComplete="new-password"
                    id="confirm-password"
                    name="confirm-password"
                    label="Confirmer le mot de passe"
                    value={confirmPassword}
                    isVisible={isConfirmVisible}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    onToggleVisibility={() => setIsConfirmVisible((value) => !value)}
                />
                {error && <AlertMessage message={error} />}
                <SubmitButton
                    isSubmitting={isSubmitting}
                    label="Créer le mot de passe"
                    loadingLabel="Activation..."
                />
            </FormRoot>
        </AuthCardFrame>
    );
}
