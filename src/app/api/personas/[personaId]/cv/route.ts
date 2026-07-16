import { NextRequest, NextResponse } from "next/server";
import { getPersonaCvAccess } from "@/features/personas/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ personaId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        const access = await getPersonaCvAccess(personaId);
        const response = NextResponse.redirect(access.url);
        response.headers.set("Cache-Control", "private, no-store");
        return response;
    } catch (error) {
        return jsonError(error);
    }
}
