import { FormSkeleton } from "@/lib/ui/molecules";
import { AuthCardFrame } from "./AuthCardFrame";

export function SignInCardFallback() {
    return (
        <AuthCardFrame title="Welcome Back" description="Sign in to continue your training">
            <FormSkeleton />
        </AuthCardFrame>
    );
}
