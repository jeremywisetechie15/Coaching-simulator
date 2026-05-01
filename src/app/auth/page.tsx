import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignInCard, SignInCardFallback } from "@/features/auth/components";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
    title: "Sign In | MaiaCoach",
};

interface AuthPageProps {
    searchParams?: Promise<{
        redirect?: string;
    }>;
}

function getSafeRedirect(value: string | undefined) {
    if (!value || !value.startsWith("/") || value.startsWith("//")) {
        return "/profile";
    }

    return value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
    const params = await searchParams;
    const redirectTo = getSafeRedirect(params?.redirect);
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
