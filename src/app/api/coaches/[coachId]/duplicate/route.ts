import { NextRequest, NextResponse } from "next/server";
import { duplicateCoach } from "@/features/coaches/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{ coachId: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteContext) {
    try {
        const { coachId } = await params;
        const coach = await duplicateCoach(coachId);

        return NextResponse.json({ coach }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
