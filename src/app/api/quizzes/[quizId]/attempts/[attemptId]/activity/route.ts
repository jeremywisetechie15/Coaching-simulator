import { NextRequest, NextResponse } from "next/server";
import { recordQuizAttemptActivity } from "@/features/activity-tracking/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface QuizAttemptActivityRouteContext {
    params: Promise<{ attemptId: string; quizId: string }>;
}

export async function PATCH(request: NextRequest, context: QuizAttemptActivityRouteContext) {
    try {
        const { attemptId, quizId } = await context.params;
        const activity = await recordQuizAttemptActivity(quizId, attemptId, await request.json());
        return NextResponse.json({ activity });
    } catch (error) {
        return jsonError(error);
    }
}
