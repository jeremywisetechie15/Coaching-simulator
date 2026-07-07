import { NextRequest, NextResponse } from "next/server";
import { getRoleplayResourceAccess } from "@/features/roleplays/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RoleplayResourceRouteContext {
    params: Promise<{ resourceId: string; roleplayId: string }>;
}

export async function GET(_request: NextRequest, context: RoleplayResourceRouteContext) {
    try {
        const { resourceId, roleplayId } = await context.params;
        const access = await getRoleplayResourceAccess(roleplayId, resourceId);

        return NextResponse.redirect(access.url);
    } catch (error) {
        return jsonError(error);
    }
}
