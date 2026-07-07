import { NextRequest, NextResponse } from "next/server";
import { saveQuizAttemptAnswers } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface QuizAttemptAnswersRouteContext {
    params: Promise<{ attemptId: string; quizId: string }>;
}

export async function PATCH(request: NextRequest, context: QuizAttemptAnswersRouteContext) {
    try {
        const { attemptId, quizId } = await context.params;
        const attempt = await saveQuizAttemptAnswers(quizId, attemptId, await request.json());

        return NextResponse.json({ attempt });
    } catch (error) {
        return jsonError(error);
    }
}
