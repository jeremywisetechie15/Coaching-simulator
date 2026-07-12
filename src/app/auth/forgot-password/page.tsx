import { Suspense } from "react";
import { ForgotPasswordCard, SignInCardFallback } from "@/features/auth/components";

export const metadata = {
    title: "Mot de passe oublié | MaiaCoach",
};

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<SignInCardFallback />}>
            <ForgotPasswordCard />
        </Suspense>
    );
}
