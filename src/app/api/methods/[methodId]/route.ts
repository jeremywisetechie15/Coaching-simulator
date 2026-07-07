import { NextRequest, NextResponse } from "next/server";
import { archiveMethod, getMethodById, parseSaveMethodRequest, updateMethod } from "@/features/methods/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface MethodRouteContext {
    params: Promise<{ methodId: string }>;
}

export async function GET(_request: NextRequest, context: MethodRouteContext) {
    try {
        const { methodId } = await context.params;
        const method = await getMethodById(methodId);

        return NextResponse.json({ method });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, context: MethodRouteContext) {
    try {
        const { methodId } = await context.params;
        const { input, uploadFilesByClientId } = await parseSaveMethodRequest(request);
        const method = await updateMethod(methodId, input, uploadFilesByClientId);

        return NextResponse.json({ method });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, context: MethodRouteContext) {
    try {
        const { methodId } = await context.params;
        await archiveMethod(methodId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
