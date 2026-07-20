import type { SupabaseClient } from "@supabase/supabase-js";

interface QuizStepIdentityRow {
    id: string;
    quiz_id: string;
}

interface QuizQuestionIdentityRow {
    step_id: string;
}

export async function fetchQuizQuestionCounts(
    supabase: SupabaseClient,
    quizIds: string[],
): Promise<Map<string, number>> {
    const uniqueQuizIds = Array.from(new Set(quizIds));
    if (uniqueQuizIds.length === 0) return new Map();

    const { data: stepRows, error: stepError } = await supabase
        .from("quiz_steps")
        .select("id, quiz_id")
        .in("quiz_id", uniqueQuizIds)
        .returns<QuizStepIdentityRow[]>();

    if (stepError) throw stepError;

    const quizIdByStepId = new Map(
        (stepRows ?? []).map((step) => [step.id, step.quiz_id]),
    );
    const stepIds = Array.from(quizIdByStepId.keys());
    if (stepIds.length === 0) return new Map();

    const { data: questionRows, error: questionError } = await supabase
        .from("quiz_questions")
        .select("step_id")
        .in("step_id", stepIds)
        .returns<QuizQuestionIdentityRow[]>();

    if (questionError) throw questionError;

    const countByQuizId = new Map<string, number>();
    for (const question of questionRows ?? []) {
        const quizId = quizIdByStepId.get(question.step_id);
        if (!quizId) continue;
        countByQuizId.set(quizId, (countByQuizId.get(quizId) ?? 0) + 1);
    }

    return countByQuizId;
}
