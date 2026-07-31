import { requireAuth } from "@/features/auth/server";
import type { ContentStatus } from "@/features/content/domain";
import {
    QUIZ_DEFAULT_VALIDATION_THRESHOLD,
    getQuizTypeLabel,
    type QuizDifficulty,
    type QuizType,
} from "@/features/evaluations/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapQuizRowToListItem, type QuizRow } from "./quiz.mapper";
import { QUIZ_SELECT } from "./quiz.persistence";

interface QuizAttemptHistoryRow {
    active_duration_seconds: number | null;
    attempt_number: number;
    completed_at: string | null;
    id: string;
    passed: boolean | null;
    quiz_id: string;
    score_percent: number | null;
}

export interface QuizAttemptHistoryItem {
    attempt: {
        activeDurationSeconds: number | null;
        id: string;
        number: number;
        passed: boolean;
        score: number;
    };
    occurredAt: string;
    quiz: {
        categories: string[];
        difficulty: QuizDifficulty | null;
        domain: string;
        id: string;
        status: ContentStatus;
        title: string;
        type: QuizType;
        typeLabel: string;
        validationThreshold: number;
    };
}

interface ListQuizAttemptHistoryInput {
    quizId?: string | null;
}

function normalizeScore(value: number | null) {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueQuizIds(attempts: QuizAttemptHistoryRow[]) {
    return Array.from(new Set(attempts.map((attempt) => attempt.quiz_id)));
}

export async function listQuizAttemptHistory({
    quizId,
}: ListQuizAttemptHistoryInput): Promise<QuizAttemptHistoryItem[]> {
    const { userId } = await requireAuth();
    const adminSupabase = createAdminClient();
    let attemptQuery = adminSupabase
        .from("quiz_attempts")
        .select(
            "id, quiz_id, attempt_number, completed_at, active_duration_seconds, score_percent, passed",
        )
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false });

    if (quizId) {
        attemptQuery = attemptQuery.eq("quiz_id", quizId);
    }

    const { data: attemptRows, error: attemptError } =
        await attemptQuery.returns<QuizAttemptHistoryRow[]>();

    if (attemptError) throw attemptError;

    const attempts = attemptRows ?? [];
    if (attempts.length === 0) return [];

    // Attempts are already restricted to this learner. The server-side metadata
    // read preserves archived results without exposing archived quizzes via RLS.
    const { data: quizRows, error: quizError } = await adminSupabase
        .from("quizzes")
        .select(QUIZ_SELECT)
        .in("id", uniqueQuizIds(attempts))
        .returns<QuizRow[]>();

    if (quizError) throw quizError;

    const quizzesById = new Map(
        (quizRows ?? []).map((row) => {
            const quiz = mapQuizRowToListItem(row);
            const validationThreshold =
                quiz.validationThreshold ?? QUIZ_DEFAULT_VALIDATION_THRESHOLD;

            return [
                quiz.id,
                {
                    categories: quiz.categories,
                    difficulty: quiz.difficulty,
                    domain: quiz.domain,
                    id: quiz.id,
                    status: quiz.status,
                    title: quiz.title,
                    type: quiz.type,
                    typeLabel: getQuizTypeLabel(quiz.type),
                    validationThreshold,
                },
            ] as const;
        }),
    );

    return attempts.flatMap((attempt) => {
        const quiz = quizzesById.get(attempt.quiz_id);
        if (!quiz || !attempt.completed_at) return [];

        const score = normalizeScore(attempt.score_percent);

        return [
            {
                attempt: {
                    activeDurationSeconds: attempt.active_duration_seconds,
                    id: attempt.id,
                    number: attempt.attempt_number,
                    passed: attempt.passed ?? score >= quiz.validationThreshold,
                    score,
                },
                occurredAt: attempt.completed_at,
                quiz,
            },
        ];
    });
}
