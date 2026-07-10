import { NextRequest, NextResponse } from "next/server";
import { duplicateRoleplay } from "@/features/roleplays/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface DuplicateRoleplayRouteContext {
    params: Promise<{ roleplayId: string }>;
}

export async function POST(_request: NextRequest, context: DuplicateRoleplayRouteContext) {
    try {
        const { roleplayId } = await context.params;
        const roleplay = await duplicateRoleplay(roleplayId);

        return NextResponse.json({ roleplay }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
