import { NextRequest, NextResponse } from "next/server";
import {
    archivePersona,
    getPersonaDetailById,
    parseSavePersonaRequest,
    updatePersona,
} from "@/features/personas/server";
import { requireAdmin } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        personaId: string;
    }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        const persona = await getPersonaDetailById(personaId);

        if (!persona) throw new NotFoundError("Persona introuvable.");
        return NextResponse.json({ persona });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        await requireAdmin();
        const { personaId } = await params;
        const { avatarFile, input } = await parseSavePersonaRequest(request);
        const persona = await updatePersona(personaId, input, avatarFile);

        return NextResponse.json({ persona });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
    try {
        const { personaId } = await params;
        await archivePersona(personaId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
