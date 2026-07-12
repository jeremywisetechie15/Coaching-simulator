import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignInCard, SignInCardFallback } from "@/features/auth/components";
import { createClient } from "@/lib/supabase/server";
import { resolveInternalHref } from "@/features/app-shell/domain";

export const metadata = {
    title: "Sign In | MaiaCoach",
};

interface AuthPageProps {
    searchParams?: Promise<{
        redirect?: string;
    }>;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
    const params = await searchParams;
    const redirectTo = resolveInternalHref(params?.redirect, "/profile");
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {
        redirect(redirectTo);
    }

    return (
        <Suspense fallback={<SignInCardFallback />}>
            <SignInCard />
        </Suspense>
    );
}
