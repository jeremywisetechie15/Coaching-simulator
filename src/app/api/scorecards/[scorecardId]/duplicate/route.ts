import { NextRequest, NextResponse } from "next/server";
import { duplicateScorecard } from "@/features/scorecards/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface DuplicateScorecardRouteContext {
    params: Promise<{ scorecardId: string }>;
}

export async function POST(_request: NextRequest, context: DuplicateScorecardRouteContext) {
    try {
        const { scorecardId } = await context.params;
        const scorecard = await duplicateScorecard(scorecardId);

        return NextResponse.json({ scorecard }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
