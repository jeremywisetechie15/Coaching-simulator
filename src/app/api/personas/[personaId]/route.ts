import { NextRequest, NextResponse } from "next/server";
import { savePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { updatePersona } from "@/features/personas/server";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        personaId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        const input = savePersonaDto.parse(await request.json());
        const persona = await updatePersona(personaId, input);

        return NextResponse.json({ persona });
    } catch (error) {
        return jsonError(error);
    }
}
