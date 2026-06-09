import { NextRequest, NextResponse } from "next/server";
import { saveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { updateCoach } from "@/features/coaches/server";
import { jsonError } from "@/lib/server/http";

interface RouteContext {
    params: Promise<{
        coachId: string;
    }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
    try {
        const { coachId } = await params;
        const input = saveCoachDto.parse(await request.json());
        const coach = await updateCoach(coachId, input);

        return NextResponse.json({ coach });
    } catch (error) {
        return jsonError(error);
    }
}
