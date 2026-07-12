"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { resolveInternalHref } from "@/features/app-shell/domain";
import {
    AUTH_PATHS,
    buildAuthPath,
    validateNewPassword,
} from "@/features/auth/domain/password-recovery";
import { createClient } from "@/lib/supabase/client";
import { FormRoot } from "@/lib/ui/atoms";
import { AlertMessage, PasswordField, StatusMessage, SubmitButton } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { AuthCardFrame } from "./AuthCardFrame";

interface ResetPasswordCardProps {
    hasRecoverySession: boolean;
}

export function ResetPasswordCard({ hasRecoverySession }: ResetPasswordCardProps) {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(
        () => resolveInternalHref(searchParams.get("redirect"), "/profile"),
        [searchParams],
    );
    const forgotPasswordHref = buildAuthPath(AUTH_PATHS.forgotPassword, redirectTo);
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const validationError = validateNewPassword(password, confirmation);

        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({ password });

        if (updateError) {
            setIsSubmitting(false);
            setError("Le lien a expiré ou a déjà été utilisé. Demandez un nouveau lien.");
            return;
        }

        const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });

        if (signOutError) {
            setIsSubmitting(false);
            setError(
                "Le mot de passe a été modifié, mais la déconnexion a échoué. Déconnectez-vous manuellement avant de continuer.",
            );
            return;
        }

        window.location.replace(buildAuthPath(AUTH_PATHS.signIn, redirectTo, "password-reset"));
    };

    return (
        <AuthCardFrame
            title="Nouveau mot de passe"
            description="Choisissez un nouveau mot de passe pour sécuriser votre compte"
        >
            {!hasRecoverySession ? (
                <div className="space-y-5">
                    <StatusMessage
                        message="Ce lien est invalide, expiré ou a déjà été utilisé."
                    />
                    <Link
                        href={forgotPasswordHref}
                        className={`${uiTokens.action.primaryFullButton} w-full`}
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            ) : (
                <FormRoot onSubmit={handleSubmit}>
                    <PasswordField
                        autoComplete="new-password"
                        id="new-password"
                        name="new-password"
                        label="Nouveau mot de passe"
                        value={password}
                        isVisible={isPasswordVisible}
                        onChange={(event) => setPassword(event.target.value)}
                        onToggleVisibility={() => setIsPasswordVisible((value) => !value)}
                    />
                    <PasswordField
                        autoComplete="new-password"
                        id="confirm-new-password"
                        name="confirm-new-password"
                        label="Confirmer le nouveau mot de passe"
                        value={confirmation}
                        isVisible={isConfirmationVisible}
                        onChange={(event) => setConfirmation(event.target.value)}
                        onToggleVisibility={() => setIsConfirmationVisible((value) => !value)}
                    />
                    {error && <AlertMessage message={error} />}
                    <SubmitButton
                        isSubmitting={isSubmitting}
                        label="Modifier le mot de passe"
                        loadingLabel="Modification..."
                    />
                </FormRoot>
            )}
        </AuthCardFrame>
    );
}
