import { NextRequest, NextResponse } from "next/server";
import { getMethodResourceAccess } from "@/features/methods/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface MethodResourceRouteContext {
    params: Promise<{ methodId: string; resourceId: string }>;
}

export async function GET(_request: NextRequest, context: MethodResourceRouteContext) {
    try {
        const { methodId, resourceId } = await context.params;
        const access = await getMethodResourceAccess(methodId, resourceId);

        return NextResponse.redirect(access.url);
    } catch (error) {
        return jsonError(error);
    }
}
