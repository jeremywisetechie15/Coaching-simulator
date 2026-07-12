import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/server";
import { updateCoach } from "@/features/coaches/server";
import { parseSaveCoachRequest } from "@/features/coaches/server/save-coach-request";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        coachId: string;
    }>;
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
