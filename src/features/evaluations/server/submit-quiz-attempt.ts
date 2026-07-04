import type { QuizAttemptSession } from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { quizAttemptAnswersDto, type QuizAttemptAnswersInput } from "@/features/evaluations/dto";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";
import {
    createQuizAttemptStepScoreRows,
    scoreQuizAttempt,
} from "./quiz-attempt.persistence";
import {
    fetchQuizAttemptDetail,
    QUIZ_ATTEMPT_SELECT,
} from "./quiz-attempt-query";
import { fetchQuizDetail } from "./quiz-query";
import { replaceQuizAttemptAnswers } from "./save-quiz-attempt-answers";

export async function submitQuizAttempt(
    quizId: string,
    attemptId: string,
    input: QuizAttemptAnswersInput,
): Promise<QuizAttemptSession> {
    const context = await requireAuth();
    const payload = quizAttemptAnswersDto.parse(input);
    const adminSupabase = createAdminClient();

    const { data: attempt, error: attemptError } = await adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("id", attemptId)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .maybeSingle<QuizAttemptRow>();

    if (attemptError) throw attemptError;

    if (!attempt) {
        throw new NotFoundError("Tentative de quiz introuvable.");
    }

    if (attempt.status === "completed") {
        throw new AppError("Cette tentative est déjà terminée.", 409, "QUIZ_ATTEMPT_ALREADY_COMPLETED");
    }

    const quiz = await fetchQuizDetail(adminSupabase, quizId);
    const normalizedAnswers = await replaceQuizAttemptAnswers(adminSupabase, attempt.id, quiz, payload.answers);
    const score = scoreQuizAttempt(quiz, normalizedAnswers);

    const { error: deleteScoresError } = await adminSupabase
        .from("quiz_attempt_step_scores")
        .delete()
        .eq("attempt_id", attempt.id);

    if (deleteScoresError) throw deleteScoresError;

    const stepScoreRows = createQuizAttemptStepScoreRows(attempt.id, score);
    if (stepScoreRows.length > 0) {
        const { error: insertScoresError } = await adminSupabase
            .from("quiz_attempt_step_scores")
            .insert(stepScoreRows);

        if (insertScoresError) throw insertScoresError;
    }

    const completedAt = new Date().toISOString();
    const { data: completedAttempt, error: updateError } = await adminSupabase
        .from("quiz_attempts")
        .update({
            completed_at: completedAt,
            earned_points: score.earnedPoints,
            max_points: score.maxPoints,
            passed: score.passed,
            score_percent: score.scorePercent,
            status: "completed",
        })
        .eq("id", attempt.id)
        .select(QUIZ_ATTEMPT_SELECT)
        .single<QuizAttemptRow>();

    if (updateError) throw updateError;

    const { count: completedCount, error: countError } = await adminSupabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed");

    if (countError) throw countError;

    const attemptsUsed = completedCount ?? completedAttempt.attempt_number;
    const maxAttempts = quiz.maxAttempts;

    return {
        attempt: await fetchQuizAttemptDetail(adminSupabase, completedAttempt),
        attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
        attemptsUsed,
        canStartNewAttempt: attemptsUsed < maxAttempts,
        maxAttempts,
    };
}
