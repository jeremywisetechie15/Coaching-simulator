import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/server";
import {
    getRoleplayById,
    parseSaveRoleplayRequest,
    removeRoleplay,
    updateRoleplay,
} from "@/features/roleplays/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RoleplayRouteContext {
    params: Promise<{ roleplayId: string }>;
}

export async function GET(_request: NextRequest, context: RoleplayRouteContext) {
    try {
        await requireAdmin();
        const { roleplayId } = await context.params;
        const roleplay = await getRoleplayById(roleplayId);

        return NextResponse.json({ roleplay });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, context: RoleplayRouteContext) {
    try {
        const { roleplayId } = await context.params;
        const { backgroundFile, input, uploadFilesByClientId } = await parseSaveRoleplayRequest(request);
        const roleplay = await updateRoleplay(roleplayId, input, uploadFilesByClientId, backgroundFile);

        return NextResponse.json({ roleplay });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, context: RoleplayRouteContext) {
    try {
        const { roleplayId } = await context.params;
        const action = await removeRoleplay(roleplayId);

        return NextResponse.json({ action, ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
