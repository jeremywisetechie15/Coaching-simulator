"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FormRoot } from "@/lib/ui/atoms";
import { AlertMessage, FormHeader, PasswordField, SubmitButton } from "@/lib/ui/molecules";
import { CenteredCardFrame } from "@/lib/ui/organisms";

const frameClasses = {
    surface: "bg-[#F7F8FB] px-5 py-8 text-slate-950",
    container: "min-h-[calc(100vh-4rem)] max-w-5xl",
    card: "max-w-[400px] rounded-[18px] border border-white px-6 py-7 shadow-[0_20px_45px_rgba(15,23,42,0.11)] sm:px-7 sm:py-8",
};

const headerClasses = {
    root: "mb-6 text-center",
    eyebrow: "text-[24px] font-black tracking-normal text-[#5140F0] sm:text-[26px]",
    title: "mt-6 text-[20px] font-extrabold tracking-normal text-slate-950 sm:text-[22px]",
    description: "mt-2 text-[13px] font-semibold tracking-normal text-slate-500 sm:text-[14px]",
};

function getSafeRedirect(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/profile";
    }

    return value;
}

export function SetPasswordCard() {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(() => getSafeRedirect(searchParams.get("redirect")), [searchParams]);
    const organizationId = searchParams.get("organization_id");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmVisible, setIsConfirmVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);

        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setIsSubmitting(true);

        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        setIsSubmitting(false);

        if (updateError) {
            setError("Lien expiré ou session invalide. Demandez une nouvelle invitation.");
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
        <CenteredCardFrame
            surfaceClassName={frameClasses.surface}
            containerClassName={frameClasses.container}
            cardClassName={frameClasses.card}
        >
            <FormHeader
                eyebrow="MaiaCoach"
                title="Créer votre mot de passe"
                description="Définissez un mot de passe pour activer votre compte"
                className={headerClasses.root}
                eyebrowClassName={headerClasses.eyebrow}
                titleClassName={headerClasses.title}
                descriptionClassName={headerClasses.description}
            />
            <FormRoot onSubmit={handleSubmit}>
                <PasswordField
                    id="password"
                    name="password"
                    label="Mot de passe"
                    value={password}
                    isVisible={isPasswordVisible}
                    onChange={(event) => setPassword(event.target.value)}
                    onToggleVisibility={() => setIsPasswordVisible((value) => !value)}
                />
                <PasswordField
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
        </CenteredCardFrame>
    );
}
