import { FormSkeleton } from "@/lib/ui/molecules";
import { SIGN_IN_COPY } from "@/features/auth/domain/sign-in-copy";
import { AuthCardFrame } from "./AuthCardFrame";

export function SignInCardFallback() {
    return (
        <AuthCardFrame title={SIGN_IN_COPY.title} description={SIGN_IN_COPY.description}>
            <FormSkeleton />
        </AuthCardFrame>
    );
}
