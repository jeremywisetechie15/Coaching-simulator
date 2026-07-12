import { Suspense } from "react";
import { ResetPasswordCard, SignInCardFallback } from "@/features/auth/components";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Nouveau mot de passe | MaiaCoach",
};

interface ResetPasswordPageProps {
    searchParams?: Promise<{
        status?: string;
    }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const params = await searchParams;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const hasRecoverySession = params?.status === "recovery" && Boolean(user);

    return (
        <Suspense fallback={<SignInCardFallback />}>
            <ResetPasswordCard hasRecoverySession={hasRecoverySession} />
        </Suspense>
    );
}
