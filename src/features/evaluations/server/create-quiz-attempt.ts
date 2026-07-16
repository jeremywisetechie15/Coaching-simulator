import {
    getQuizAttemptsRemaining,
    hasReachedQuizAttemptLimit,
    normalizeQuizMaxAttempts,
    type QuizAttemptSession,
} from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { AppError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";
import { getAccessibleQuizForAttempt } from "./quiz-attempt-access";

export async function createQuizAttempt(quizId: string): Promise<QuizAttemptSession> {
    const context = await requireAuth();
    const authenticatedSupabase = await createClient();
    const adminSupabase = createAdminClient();
    const quiz = await getAccessibleQuizForAttempt(authenticatedSupabase, quizId);
    const maxAttempts = normalizeQuizMaxAttempts(quiz.max_attempts);

    const { data: inProgressAttempt, error: inProgressError } = await adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .maybeSingle<QuizAttemptRow>();

    if (inProgressError) throw inProgressError;

    const { count: completedCount, error: countError } = await adminSupabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed");

    if (countError) throw countError;

    const attemptsUsed = completedCount ?? 0;

    if (inProgressAttempt) {
        return {
            attempt: await fetchQuizAttemptDetail(adminSupabase, inProgressAttempt),
            attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
            attemptsUsed,
            canStartNewAttempt: false,
            maxAttempts,
        };
    }

    if (hasReachedQuizAttemptLimit(maxAttempts, attemptsUsed)) {
        throw new AppError("Le nombre maximal de tentatives est atteint.", 409, "QUIZ_MAX_ATTEMPTS_REACHED");
    }

    const { data: attemptRow, error: insertError } = await adminSupabase
        .from("quiz_attempts")
        .insert({
            attempt_number: attemptsUsed + 1,
            quiz_id: quizId,
            status: "in_progress",
            user_id: context.userId,
        })
        .select(QUIZ_ATTEMPT_SELECT)
        .single<QuizAttemptRow>();

    if (insertError) throw insertError;

    return {
        attempt: await fetchQuizAttemptDetail(adminSupabase, attemptRow),
        attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
        attemptsUsed,
        canStartNewAttempt: false,
        maxAttempts,
    };
}
