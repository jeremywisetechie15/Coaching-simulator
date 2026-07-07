import { requireAuth } from "@/features/auth/server";
import { QUIZ_KIND, type QuizListItem, type QuizOption } from "@/features/evaluations/domain/quiz";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizList } from "./quiz-query";

interface ListQuizOptionsParams {
    availableForMethodId?: string;
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
        .filter(
            (quiz) =>
                params.includeArchived ||
                quiz.status !== "archived" ||
                (params.availableForMethodId && quiz.methodId === params.availableForMethodId),
        )
        .filter((quiz) => !params.unassignedOnly || !quiz.methodId)
        .filter((quiz) => !params.availableForMethodId || !quiz.methodId || quiz.methodId === params.availableForMethodId)
        .map((quiz) => ({
            id: quiz.id,
            kind: quiz.kind,
            methodId: quiz.methodId,
            questionCount: quiz.questionCount,
            title: quiz.title,
        }));
}

export async function getMethodAssociatedQuizOption(methodId: string): Promise<QuizOption | null> {
    const quizzes = await listQuizOptions();

    return quizzes.find((quiz) => quiz.methodId === methodId && quiz.kind === QUIZ_KIND.methodKnowledge) ?? null;
}
