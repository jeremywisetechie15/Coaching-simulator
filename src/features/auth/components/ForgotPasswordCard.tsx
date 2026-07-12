"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { resolveInternalHref } from "@/features/app-shell/domain";
import {
    AUTH_PATHS,
    buildAuthPath,
    buildPasswordRecoveryRedirectUrl,
} from "@/features/auth/domain/password-recovery";
import { createClient } from "@/lib/supabase/client";
import { FormRoot, InlineIcon } from "@/lib/ui/atoms";
import { AlertMessage, StatusMessage, SubmitButton, TextField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { AuthCardFrame } from "./AuthCardFrame";

const confirmationMessage =
    "Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé.";

export function ForgotPasswordCard() {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(
        () => resolveInternalHref(searchParams.get("redirect"), "/profile"),
        [searchParams],
    );
    const signInHref = buildAuthPath(AUTH_PATHS.signIn, redirectTo);
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        const supabase = createClient();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: buildPasswordRecoveryRedirectUrl(window.location.origin, redirectTo),
        });

        setIsSubmitting(false);

        if (resetError) {
            setError(
                resetError.status === 429
                    ? "Une demande a déjà été envoyée récemment. Patientez une minute avant de réessayer."
                    : "L’email n’a pas pu être envoyé. Réessayez dans quelques instants.",
            );
            return;
        }

        setIsSent(true);
    };

    return (
        <AuthCardFrame
            title="Mot de passe oublié"
            description="Recevez un lien sécurisé pour définir un nouveau mot de passe"
        >
            {isSent ? (
                <div className="space-y-5">
                    <StatusMessage tone="success" message={confirmationMessage} />
                    <Link href={signInHref} className={`${uiTokens.action.secondaryButton} w-full gap-2`}>
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                        Retour à la connexion
                    </Link>
                </div>
            ) : (
                <FormRoot onSubmit={handleSubmit}>
                    <TextField
                        id="recovery-email"
                        name="email"
                        label="Email"
                        icon={Mail}
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="vous@exemple.com"
                    />
                    {error && <AlertMessage message={error} />}
                    <SubmitButton
                        isSubmitting={isSubmitting}
                        label="Envoyer le lien"
                        loadingLabel="Envoi en cours..."
                    />
                    <div className="text-center text-[13px]">
                        <Link href={signInHref} className={uiTokens.auth.link}>
                            Retour à la connexion
                        </Link>
                    </div>
                </FormRoot>
            )}
        </AuthCardFrame>
    );
}
