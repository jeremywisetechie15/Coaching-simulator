import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuizAttemptAnswer, QuizAttemptDetail, QuizDetail } from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { quizAttemptAnswersDto, type QuizAttemptAnswersInput } from "@/features/evaluations/dto";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizAttemptAnswerRow, QuizAttemptRow } from "./quiz-attempt.mapper";
import { normalizeQuizAttemptAnswers } from "./quiz-attempt.persistence";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_ANSWER_SELECT, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";
import { fetchQuizDetail } from "./quiz-query";

async function getEditableAttempt(
    supabase: SupabaseClient,
    quizId: string,
    attemptId: string,
    userId: string,
) {
    const { data: attempt, error } = await supabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("id", attemptId)
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
        .maybeSingle<QuizAttemptRow>();

    if (error) throw error;

    if (!attempt) {
        throw new NotFoundError("Tentative de quiz introuvable.");
    }

    if (attempt.status === "completed") {
        throw new AppError("Cette tentative est déjà terminée.", 409, "QUIZ_ATTEMPT_ALREADY_COMPLETED");
    }

    return attempt;
}

export async function replaceQuizAttemptAnswers(
    supabase: SupabaseClient,
    attemptId: string,
    quiz: Pick<QuizDetail, "steps">,
    answers: QuizAttemptAnswer[],
) {
    const normalizedAnswers = normalizeQuizAttemptAnswers(quiz, answers);

    const { error: deleteError } = await supabase
        .from("quiz_attempt_answers")
        .delete()
        .eq("attempt_id", attemptId);

    if (deleteError) throw deleteError;

    if (normalizedAnswers.length === 0) {
        return normalizedAnswers;
    }

    const { data: answerRows, error: answerError } = await supabase
        .from("quiz_attempt_answers")
        .insert(
            normalizedAnswers.map((answer) => ({
                attempt_id: attemptId,
                question_id: answer.questionId,
            })),
        )
        .select(QUIZ_ATTEMPT_ANSWER_SELECT);

    if (answerError) throw answerError;

    const answerIdByQuestionId = new Map(
        ((answerRows ?? []) as QuizAttemptAnswerRow[]).map((answer) => [answer.question_id, answer.id]),
    );
    const choiceRows = normalizedAnswers.flatMap((answer) => {
        const answerId = answerIdByQuestionId.get(answer.questionId);
        if (!answerId) return [];

        return answer.choiceIds.map((choiceId) => ({
            answer_id: answerId,
            choice_id: choiceId,
        }));
    });

    if (choiceRows.length > 0) {
        const { error: choiceError } = await supabase
            .from("quiz_attempt_answer_choices")
            .insert(choiceRows);

        if (choiceError) throw choiceError;
    }

    return normalizedAnswers;
}

export async function saveQuizAttemptAnswers(
    quizId: string,
    attemptId: string,
    input: QuizAttemptAnswersInput,
): Promise<QuizAttemptDetail> {
    const context = await requireAuth();
    const payload = quizAttemptAnswersDto.parse(input);
    const adminSupabase = createAdminClient();
    const attempt = await getEditableAttempt(adminSupabase, quizId, attemptId, context.userId);
    const quiz = await fetchQuizDetail(adminSupabase, quizId);

    await replaceQuizAttemptAnswers(adminSupabase, attempt.id, quiz, payload.answers);

    return fetchQuizAttemptDetail(adminSupabase, attempt);
}
