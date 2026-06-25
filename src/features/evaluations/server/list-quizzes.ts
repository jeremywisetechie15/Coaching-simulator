import { requireAuth } from "@/features/auth/server";
import type { QuizListItem, QuizOption } from "@/features/evaluations/domain/quiz";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizList } from "./quiz-query";

interface ListQuizOptionsParams {
    includeArchived?: boolean;
    unassignedOnly?: boolean;
}

export async function listQuizzes(): Promise<QuizListItem[]> {
    await requireAuth();
    const supabase = await createClient();

    return fetchQuizList(supabase);
}

export async function listQuizOptions(params: ListQuizOptionsParams = {}): Promise<QuizOption[]> {
    const quizzes = await listQuizzes();

    return quizzes
        .filter((quiz) => params.includeArchived || quiz.status !== "archived")
        .filter((quiz) => !params.unassignedOnly || !quiz.methodId)
        .map((quiz) => ({
            id: quiz.id,
            methodId: quiz.methodId,
            questionCount: quiz.questionCount,
            title: quiz.title,
        }));
}
