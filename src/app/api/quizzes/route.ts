import { NextRequest, NextResponse } from "next/server";
import { createQuiz, listQuizzes, parseSaveQuizRequest } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const quizzes = await listQuizzes();

        return NextResponse.json({ quizzes });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { input, uploadFilesByClientId } = await parseSaveQuizRequest(request);
        const quiz = await createQuiz(input, uploadFilesByClientId);

        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
