"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FormRoot } from "@/lib/ui/atoms";
import { AlertMessage, FormHeader, PasswordField, SubmitButton, TextField } from "@/lib/ui/molecules";
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

const defaultRedirectPath = "/profile";

function getSafeRedirect(value: string | null) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return defaultRedirectPath;
    }

    return value;
}

export function SignInCard() {
    const searchParams = useSearchParams();
    const redirectTo = useMemo(() => getSafeRedirect(searchParams.get("redirect")), [searchParams]);

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
        <CenteredCardFrame
            surfaceClassName={frameClasses.surface}
            containerClassName={frameClasses.container}
            cardClassName={frameClasses.card}
        >
            <FormHeader
                eyebrow="MaiaCoach"
                title="Welcome Back"
                description="Sign in to continue your training"
                className={headerClasses.root}
                eyebrowClassName={headerClasses.eyebrow}
                titleClassName={headerClasses.title}
                descriptionClassName={headerClasses.description}
            />
            <FormRoot onSubmit={handleSubmit}>
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
                {error && <AlertMessage message={error} />}
                <SubmitButton isSubmitting={isSubmitting} label="Sign In" loadingLabel="Connexion..." />
            </FormRoot>
        </CenteredCardFrame>
    );
}
