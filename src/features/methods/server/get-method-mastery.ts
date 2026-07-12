import { requireAuth } from "@/features/auth/server";
import {
    calculateMethodMasteryTrend,
    type MethodMastery,
} from "@/features/methods/domain/method";
import { createAdminClient } from "@/lib/supabase/admin";

interface CompletedQuizAttemptRow {
    completed_at: string | null;
    score_percent: number | string;
}

function toScore(value: number | string) {
    const score = typeof value === "number" ? value : Number(value);
    return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
}

export async function getMethodMastery(quizId: string): Promise<MethodMastery | null> {
    const context = await requireAuth();
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("quiz_attempts")
        .select("score_percent, completed_at")
        .eq("quiz_id", quizId)
        .eq("user_id", context.userId)
        .eq("status", "completed")
        .not("score_percent", "is", null)
        .order("completed_at", { ascending: false })
        .limit(2)
        .returns<CompletedQuizAttemptRow[]>();

    if (error) throw error;

    const scores = (data ?? []).flatMap((attempt) => {
        const score = toScore(attempt.score_percent);
        return score === null ? [] : [{ completedAt: attempt.completed_at, score }];
    });
    const latest = scores[0];

    if (!latest) return null;

    const comparison = calculateMethodMasteryTrend(latest.score, scores[1]?.score ?? null);

    return {
        completedAt: latest.completedAt,
        delta: comparison.delta,
        scorePercent: latest.score,
        trend: comparison.trend,
    };
}
