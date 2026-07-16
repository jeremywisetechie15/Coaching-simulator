import {
    getQuizAttemptsRemaining,
    hasReachedQuizAttemptLimit,
    normalizeQuizMaxAttempts,
    type QuizAttemptSession,
} from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";
import { getAccessibleQuizForAttempt } from "./quiz-attempt-access";

interface GetLatestQuizAttemptOptions {
    preferCompleted?: boolean;
}

export async function getLatestQuizAttempt(
    quizId: string,
    options: GetLatestQuizAttemptOptions = {},
): Promise<QuizAttemptSession> {
    const context = await requireAuth();
    const authenticatedSupabase = await createClient();
    const adminSupabase = createAdminClient();
    const quiz = await getAccessibleQuizForAttempt(authenticatedSupabase, quizId);

    const maxAttempts = normalizeQuizMaxAttempts(quiz.max_attempts);
    const { count: completedCount, error: countError } = await adminSupabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed");

    if (countError) throw countError;

    const attemptsUsed = completedCount ?? 0;

    const { data: latestCompletedAttempt, error: latestError } = await adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed")
        .order("attempt_number", { ascending: false })
        .limit(1)
        .maybeSingle<QuizAttemptRow>();

    if (latestError) throw latestError;

    const { data: inProgressAttempt, error: inProgressError } = await adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .maybeSingle<QuizAttemptRow>();

    if (inProgressError) throw inProgressError;

    if (options.preferCompleted && latestCompletedAttempt) {
        return {
            attempt: await fetchQuizAttemptDetail(adminSupabase, latestCompletedAttempt),
            attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
            attemptsUsed,
            canStartNewAttempt: !inProgressAttempt && !hasReachedQuizAttemptLimit(maxAttempts, attemptsUsed),
            maxAttempts,
        };
    }

    if (inProgressAttempt) {
        return {
            attempt: await fetchQuizAttemptDetail(adminSupabase, inProgressAttempt),
            attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
            attemptsUsed,
            canStartNewAttempt: false,
            maxAttempts,
        };
    }

    return {
        attempt: latestCompletedAttempt ? await fetchQuizAttemptDetail(adminSupabase, latestCompletedAttempt) : null,
        attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
        attemptsUsed,
        canStartNewAttempt: !hasReachedQuizAttemptLimit(maxAttempts, attemptsUsed),
        maxAttempts,
    };
}
