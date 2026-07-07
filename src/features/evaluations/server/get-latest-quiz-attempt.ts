import type { QuizAttemptSession } from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";

interface QuizAttemptQuizRow {
    id: string;
    is_active?: boolean | null;
    max_attempts?: number | null;
    status?: string | null;
}

interface GetLatestQuizAttemptOptions {
    preferCompleted?: boolean;
}

export async function getLatestQuizAttempt(
    quizId: string,
    options: GetLatestQuizAttemptOptions = {},
): Promise<QuizAttemptSession> {
    const context = await requireAuth();
    const adminSupabase = createAdminClient();

    const { data: quiz, error: quizError } = await adminSupabase
        .from("quizzes")
        .select("id, max_attempts, status, is_active")
        .eq("id", quizId)
        .maybeSingle<QuizAttemptQuizRow>();

    if (quizError) throw quizError;

    if (!quiz || quiz.is_active === false || quiz.status === "archived") {
        throw new NotFoundError("Quiz introuvable.");
    }

    const maxAttempts = quiz.max_attempts ?? 1;
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
            attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
            attemptsUsed,
            canStartNewAttempt: !inProgressAttempt && attemptsUsed < maxAttempts,
            maxAttempts,
        };
    }

    if (inProgressAttempt) {
        return {
            attempt: await fetchQuizAttemptDetail(adminSupabase, inProgressAttempt),
            attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
            attemptsUsed,
            canStartNewAttempt: false,
            maxAttempts,
        };
    }

    return {
        attempt: latestCompletedAttempt ? await fetchQuizAttemptDetail(adminSupabase, latestCompletedAttempt) : null,
        attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
        attemptsUsed,
        canStartNewAttempt: attemptsUsed < maxAttempts,
        maxAttempts,
    };
}
