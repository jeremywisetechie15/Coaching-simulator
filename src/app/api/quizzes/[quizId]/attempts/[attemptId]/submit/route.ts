import { NextRequest, NextResponse } from "next/server";
import { submitQuizAttempt } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface SubmitQuizAttemptRouteContext {
    params: Promise<{ attemptId: string; quizId: string }>;
}

export async function POST(request: NextRequest, context: SubmitQuizAttemptRouteContext) {
    try {
        const { attemptId, quizId } = await context.params;
        const session = await submitQuizAttempt(quizId, attemptId, await request.json());

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error);
    }
}
