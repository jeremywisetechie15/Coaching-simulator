import { NextRequest, NextResponse } from "next/server";
import { archiveQuiz, getQuizById, parseSaveQuizRequest, updateQuiz } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface QuizRouteContext {
    params: Promise<{ quizId: string }>;
}

export async function GET(_request: NextRequest, context: QuizRouteContext) {
    try {
        const { quizId } = await context.params;
        const quiz = await getQuizById(quizId);

        return NextResponse.json({ quiz });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, context: QuizRouteContext) {
    try {
        const { quizId } = await context.params;
        const { input, uploadFilesByClientId } = await parseSaveQuizRequest(request);
        const quiz = await updateQuiz(quizId, input, uploadFilesByClientId);

        return NextResponse.json({ quiz });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, context: QuizRouteContext) {
    try {
        const { quizId } = await context.params;
        await archiveQuiz(quizId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
