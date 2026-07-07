import { NextRequest, NextResponse } from "next/server";
import { saveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { createCoach, listCoaches } from "@/features/coaches/server";
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
        const input = saveCoachDto.parse(await request.json());
        const coach = await createCoach(input);

        return NextResponse.json({ coach }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
