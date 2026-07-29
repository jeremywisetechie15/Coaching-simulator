import {
    getQuizAttemptsRemaining,
    hasReachedQuizAttemptLimit,
    normalizeQuizMaxAttempts,
    type QuizAttemptSession,
} from "@/features/evaluations/domain";
import { requireAuth } from "@/features/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/server/errors";
import type { QuizAttemptRow } from "./quiz-attempt.mapper";
import { fetchQuizAttemptDetail, QUIZ_ATTEMPT_SELECT } from "./quiz-attempt-query";
import { getAccessibleQuizForAttempt } from "./quiz-attempt-access";

interface GetLatestQuizAttemptOptions {
    preferCompleted?: boolean;
}

interface ResolveQuizAttemptSessionOptions extends GetLatestQuizAttemptOptions {
    attemptId?: string;
}

async function resolveQuizAttemptSession(
    quizId: string,
    options: ResolveQuizAttemptSessionOptions = {},
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

    let completedAttemptQuery = adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed");

    if (options.attemptId) {
        completedAttemptQuery = completedAttemptQuery.eq("id", options.attemptId);
    } else {
        completedAttemptQuery = completedAttemptQuery
            .order("attempt_number", { ascending: false })
            .limit(1);
    }

    const { data: completedAttempt, error: completedError } =
        await completedAttemptQuery.maybeSingle<QuizAttemptRow>();

    if (completedError) throw completedError;
    if (options.attemptId && !completedAttempt) {
        throw new NotFoundError("Tentative de quiz introuvable.");
    }

    const { data: inProgressAttempt, error: inProgressError } = await adminSupabase
        .from("quiz_attempts")
        .select(QUIZ_ATTEMPT_SELECT)
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "in_progress")
        .order("started_at", { ascending: false })
        .maybeSingle<QuizAttemptRow>();

    if (inProgressError) throw inProgressError;

    if ((options.preferCompleted || options.attemptId) && completedAttempt) {
        return {
            attempt: await fetchQuizAttemptDetail(adminSupabase, completedAttempt),
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
        attempt: completedAttempt ? await fetchQuizAttemptDetail(adminSupabase, completedAttempt) : null,
        attemptsRemaining: getQuizAttemptsRemaining(maxAttempts, attemptsUsed),
        attemptsUsed,
        canStartNewAttempt: !hasReachedQuizAttemptLimit(maxAttempts, attemptsUsed),
        maxAttempts,
    };
}

export function getLatestQuizAttempt(
    quizId: string,
    options: GetLatestQuizAttemptOptions = {},
) {
    return resolveQuizAttemptSession(quizId, options);
}

export function getQuizAttempt(quizId: string, attemptId: string) {
    return resolveQuizAttemptSession(quizId, {
        attemptId,
        preferCompleted: true,
    });
}
