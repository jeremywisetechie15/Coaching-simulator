import { NextRequest, NextResponse } from "next/server";
import {
    createPersona,
    listPersonas,
    parseSavePersonaRequest,
} from "@/features/personas/server";
import { requireAdmin } from "@/features/auth/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const personas = await listPersonas();

        return NextResponse.json({ personas });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const { avatarFile, input } = await parseSavePersonaRequest(request);
        const persona = await createPersona(input, avatarFile);

        return NextResponse.json({ persona }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
