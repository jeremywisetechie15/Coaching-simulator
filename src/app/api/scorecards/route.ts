import { NextRequest, NextResponse } from "next/server";
import { saveScorecardDto } from "@/features/scorecards/dto";
import { createScorecard, listScorecards } from "@/features/scorecards/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const scorecards = await listScorecards();

        return NextResponse.json({ scorecards });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const input = saveScorecardDto.parse(await request.json());
        const scorecard = await createScorecard(input);

        return NextResponse.json({ scorecard }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
