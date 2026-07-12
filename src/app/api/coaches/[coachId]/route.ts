import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/server";
import { archiveCoach, getCoachDetailById, updateCoach } from "@/features/coaches/server";
import { parseSaveCoachRequest } from "@/features/coaches/server/save-coach-request";
import { jsonError } from "@/lib/server/http";
import { NotFoundError } from "@/lib/server/errors";

interface RouteContext {
    params: Promise<{
        coachId: string;
    }>;
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
    try {
        const { coachId } = await params;
        const coach = await getCoachDetailById(coachId);

        if (!coach) throw new NotFoundError("Coach introuvable.");
        return NextResponse.json({ coach });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        await requireAdmin();
        const { coachId } = await params;
        const { backgroundFile, input } = await parseSaveCoachRequest(request);
        const coach = await updateCoach(coachId, input, backgroundFile);

        return NextResponse.json({ coach });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
    try {
        const { coachId } = await params;
        await archiveCoach(coachId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
