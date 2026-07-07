import { NextRequest, NextResponse } from "next/server";
import { saveScorecardDto } from "@/features/scorecards/dto";
import {
    archiveScorecard,
    getScorecardById,
    updateScorecard,
} from "@/features/scorecards/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface ScorecardRouteContext {
    params: Promise<{ scorecardId: string }>;
}

export async function GET(_request: NextRequest, context: ScorecardRouteContext) {
    try {
        const { scorecardId } = await context.params;
        const scorecard = await getScorecardById(scorecardId);

        return NextResponse.json({ scorecard });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, context: ScorecardRouteContext) {
    try {
        const { scorecardId } = await context.params;
        const input = saveScorecardDto.parse(await request.json());
        const scorecard = await updateScorecard(scorecardId, input);

        return NextResponse.json({ scorecard });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, context: ScorecardRouteContext) {
    try {
        const { scorecardId } = await context.params;
        await archiveScorecard(scorecardId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
