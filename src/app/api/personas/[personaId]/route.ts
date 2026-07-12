import { NextRequest, NextResponse } from "next/server";
import { parseSavePersonaRequest, updatePersona } from "@/features/personas/server";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        personaId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        const { avatarFile, input } = await parseSavePersonaRequest(request);
        const persona = await updatePersona(personaId, input, avatarFile);

        return NextResponse.json({ persona });
    } catch (error) {
        return jsonError(error);
    }
}
