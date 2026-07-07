import type { QuizAttemptSession } from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";

interface QuizAttemptQuizRow {
    id: string;
    is_active?: boolean | null;
    max_attempts?: number | null;
    status?: string | null;
}

async function getQuizForAttempt(quizId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("quizzes")
        .select("id, max_attempts, status, is_active")
        .eq("id", quizId)
        .maybeSingle<QuizAttemptQuizRow>();

    if (error) throw error;

    if (!data || data.is_active === false || data.status === "archived") {
        throw new NotFoundError("Quiz introuvable.");
    }

    return data;
}

export async function createQuizAttempt(quizId: string): Promise<QuizAttemptSession> {
    const context = await requireAuth();
    const adminSupabase = createAdminClient();
    const quiz = await getQuizForAttempt(quizId);
    const maxAttempts = quiz.max_attempts ?? 1;

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
            attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
            attemptsUsed,
            canStartNewAttempt: false,
            maxAttempts,
        };
    }

    if (attemptsUsed >= maxAttempts) {
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
        attemptsRemaining: Math.max(maxAttempts - attemptsUsed, 0),
        attemptsUsed,
        canStartNewAttempt: false,
        maxAttempts,
    };
}
