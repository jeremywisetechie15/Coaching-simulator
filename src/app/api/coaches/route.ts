import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/features/auth/server";
import { createCoach, listCoaches } from "@/features/coaches/server";
import { parseSaveCoachRequest } from "@/features/coaches/server/save-coach-request";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const coaches = await listCoaches();

        return NextResponse.json({ coaches });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();
        const { avatarFile, backgroundFile, input } = await parseSaveCoachRequest(request);
        const coach = await createCoach(input, { avatarFile, backgroundFile });

        return NextResponse.json({ coach }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
