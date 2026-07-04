import { NextRequest, NextResponse } from "next/server";
import { getLatestQuizAttempt } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface LatestQuizAttemptRouteContext {
    params: Promise<{ quizId: string }>;
}

export async function GET(_request: NextRequest, context: LatestQuizAttemptRouteContext) {
    try {
        const { quizId } = await context.params;
        const view = _request.nextUrl.searchParams.get("view");
        const session = await getLatestQuizAttempt(quizId, { preferCompleted: view === "results" });

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error);
    }
}
