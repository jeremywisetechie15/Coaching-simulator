import { NextRequest, NextResponse } from "next/server";
import { resolveInternalHref } from "@/features/app-shell/domain";
import {
    AUTH_PATHS,
    PASSWORD_RECOVERY_TYPE,
    buildAuthPath,
    resolvePasswordRecoveryCredential,
} from "@/features/auth/domain/password-recovery";
import { createClient } from "@/lib/supabase/server";

function noStoreRedirect(destination: URL) {
    const response = NextResponse.redirect(destination);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
}

export async function GET(request: NextRequest) {
    const credential = resolvePasswordRecoveryCredential(request.nextUrl.searchParams);
    const redirect = resolveInternalHref(
        request.nextUrl.searchParams.get("redirect"),
        "/profile",
    );
    const destination = new URL(
        buildAuthPath(AUTH_PATHS.resetPassword, redirect),
        request.nextUrl.origin,
    );

    if (!credential) {
        destination.searchParams.set("status", "invalid");
        return noStoreRedirect(destination);
    }

    const supabase = await createClient();
    const { error } = credential.kind === "token_hash"
        ? await supabase.auth.verifyOtp({
            token_hash: credential.value,
            type: PASSWORD_RECOVERY_TYPE,
        })
        : await supabase.auth.exchangeCodeForSession(credential.value);

    destination.searchParams.set("status", error ? "invalid" : "recovery");
    return noStoreRedirect(destination);
}
