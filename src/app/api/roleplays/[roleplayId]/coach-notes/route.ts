import { NextRequest, NextResponse } from "next/server";
import {
    getRoleplayCoachNotesContextSchema,
    saveRoleplayCoachNotesSchema,
} from "@/features/roleplays/dto";
import { getRoleplayCoachNotes, saveRoleplayCoachNotes } from "@/features/roleplays/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ roleplayId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
    try {
        const { roleplayId } = await context.params;
        const input = getRoleplayCoachNotesContextSchema.parse(
            Object.fromEntries(request.nextUrl.searchParams.entries()),
        );
        const result = await getRoleplayCoachNotes(roleplayId, input);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error);
    }
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { roleplayId } = await context.params;
        const input = saveRoleplayCoachNotesSchema.parse(await request.json());
        const result = await saveRoleplayCoachNotes(roleplayId, input);

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error);
    }
}
