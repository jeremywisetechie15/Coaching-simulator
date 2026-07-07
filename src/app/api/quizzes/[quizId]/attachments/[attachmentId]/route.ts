import { NextRequest, NextResponse } from "next/server";
import { getQuizAttachmentAccess } from "@/features/evaluations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface QuizAttachmentRouteContext {
    params: Promise<{ attachmentId: string; quizId: string }>;
}

export async function GET(_request: NextRequest, context: QuizAttachmentRouteContext) {
    try {
        const { attachmentId, quizId } = await context.params;
        const access = await getQuizAttachmentAccess(quizId, attachmentId);

        return NextResponse.redirect(access.url);
    } catch (error) {
        return jsonError(error);
    }
}
