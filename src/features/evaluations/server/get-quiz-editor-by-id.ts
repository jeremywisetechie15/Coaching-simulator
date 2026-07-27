import { requireAdmin } from "@/features/auth/server";
import type { QuizEditorDetail } from "@/features/evaluations/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasQuizAttempts } from "./quiz-attempt-edit-policy";
import { fetchQuizDetail } from "./quiz-query";

export async function getQuizEditorById(quizId: string): Promise<QuizEditorDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [quiz, hasAttempts] = await Promise.all([
        fetchQuizDetail(adminSupabase, quizId),
        hasQuizAttempts(adminSupabase, quizId),
    ]);

    return {
        ...quiz,
        hasAttempts,
    };
}
