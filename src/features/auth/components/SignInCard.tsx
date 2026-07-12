"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { resolveInternalHref } from "@/features/app-shell/domain";
import { AUTH_PATHS, buildAuthPath } from "@/features/auth/domain/password-recovery";
import { FormRoot } from "@/lib/ui/atoms";
import { AlertMessage, PasswordField, StatusMessage, SubmitButton, TextField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { AuthCardFrame } from "./AuthCardFrame";

export function SignInCard() {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(
        () => resolveInternalHref(searchParams.get("redirect"), "/profile"),
        [searchParams],
    );
    const forgotPasswordHref = buildAuthPath(AUTH_PATHS.forgotPassword, redirectTo);
    const didResetPassword = searchParams.get("status") === "password-reset";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);
        setIsSubmitting(true);

        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setIsSubmitting(false);

        if (signInError) {
            setError("Email ou mot de passe incorrect.");
            return;
        }

        window.location.assign(redirectTo);
    };

    return (
        <AuthCardFrame title="Welcome Back" description="Sign in to continue your training">
            <FormRoot onSubmit={handleSubmit}>
                {didResetPassword && (
                    <StatusMessage
                        tone="success"
                        message="Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter."
                    />
                )}
                <TextField
                    id="email"
                    name="email"
                    label="Email"
                    icon={Mail}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                />
                <PasswordField
                    id="password"
                    name="password"
                    value={password}
                    isVisible={isPasswordVisible}
                    onChange={(event) => setPassword(event.target.value)}
                    onToggleVisibility={() => setIsPasswordVisible((value) => !value)}
                />
                <div className="flex justify-end text-[13px]">
                    <Link href={forgotPasswordHref} className={uiTokens.auth.link}>
                        Mot de passe oublié ?
                    </Link>
                </div>
                {error && <AlertMessage message={error} />}
                <SubmitButton isSubmitting={isSubmitting} label="Sign In" loadingLabel="Connexion..." />
            </FormRoot>
        </AuthCardFrame>
    );
}
