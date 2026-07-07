import { requireAuth } from "@/features/auth/server";
import type { QuizDetail } from "@/features/evaluations/domain/quiz";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizDetail } from "./quiz-query";

export async function getQuizById(quizId: string): Promise<QuizDetail> {
    await requireAuth();
    const supabase = await createClient();

    return fetchQuizDetail(supabase, quizId);
}
