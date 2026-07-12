import { NextRequest, NextResponse } from "next/server";
import { duplicatePersona } from "@/features/personas/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ personaId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        const persona = await duplicatePersona(personaId);

        return NextResponse.json({ persona }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
