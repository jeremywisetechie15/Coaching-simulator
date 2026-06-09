import { NextRequest, NextResponse } from "next/server";
import { savePersonaDto } from "@/features/personas/dto/save-persona.dto";
import { createPersona, listPersonas } from "@/features/personas/server";
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
        const input = savePersonaDto.parse(await request.json());
        const persona = await createPersona(input);

        return NextResponse.json({ persona }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
