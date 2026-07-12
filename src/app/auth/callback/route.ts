import { NextRequest, NextResponse } from "next/server";
import { resolveInternalHref } from "@/features/app-shell/domain";
import { AUTH_PATHS, buildAuthPath } from "@/features/auth/domain/password-recovery";
import { createClient } from "@/lib/supabase/server";

function noStoreRedirect(destination: URL) {
    const response = NextResponse.redirect(destination);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    return response;
}

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const flow = request.nextUrl.searchParams.get("flow");
    const redirect = resolveInternalHref(
        request.nextUrl.searchParams.get("redirect"),
        "/profile",
    );
    const destination = new URL(
        buildAuthPath(AUTH_PATHS.resetPassword, redirect),
        request.nextUrl.origin,
    );

    if (!code || flow !== "recovery") {
        destination.searchParams.set("status", "invalid");
        return noStoreRedirect(destination);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    destination.searchParams.set("status", error ? "invalid" : "recovery");
    return noStoreRedirect(destination);
}
