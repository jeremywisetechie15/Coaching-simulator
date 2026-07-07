import { NextRequest, NextResponse } from "next/server";
import { duplicateQuiz } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface DuplicateQuizRouteContext {
    params: Promise<{ quizId: string }>;
}

export async function POST(_request: NextRequest, context: DuplicateQuizRouteContext) {
    try {
        const { quizId } = await context.params;
        const quiz = await duplicateQuiz(quizId);

        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
