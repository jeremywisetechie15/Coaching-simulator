import { Suspense } from "react";
import { SetPasswordCard, SignInCardFallback } from "@/features/auth/components";

export const metadata = {
    title: "Créer un mot de passe | MaiaCoach",
};

export default function Page() {
    return (
        <Suspense fallback={<SignInCardFallback />}>
            <SetPasswordCard />
        </Suspense>
    );
}
