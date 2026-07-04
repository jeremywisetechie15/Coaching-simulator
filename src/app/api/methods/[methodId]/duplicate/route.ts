import { NextRequest, NextResponse } from "next/server";
import { duplicateMethod } from "@/features/methods/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface DuplicateMethodRouteContext {
    params: Promise<{ methodId: string }>;
}

export async function POST(_request: NextRequest, context: DuplicateMethodRouteContext) {
    try {
        const { methodId } = await context.params;
        const method = await duplicateMethod(methodId);

        return NextResponse.json({ method }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
