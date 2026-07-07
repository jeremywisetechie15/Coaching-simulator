import { NextRequest, NextResponse } from "next/server";
import { createQuizAttempt } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface QuizAttemptsRouteContext {
    params: Promise<{ quizId: string }>;
}

export async function POST(_request: NextRequest, context: QuizAttemptsRouteContext) {
    try {
        const { quizId } = await context.params;
        const session = await createQuizAttempt(quizId);

        return NextResponse.json(session, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
