import { isPlatformAdmin } from "@/features/auth/domain/access-control";
import { requireAuth } from "@/features/auth/server";
import {
    calculateMethodMasteryTrend,
    calculateParticipantAverageMethodMastery,
    METHOD_MASTERY_SCOPE,
    type MethodMastery,
    type MethodMasteryAttemptScore,
} from "@/features/methods/domain/method";
import { PLATFORM_ROLE } from "@/features/users/domain/users";
import { createAdminClient } from "@/lib/supabase/admin";

interface CompletedQuizAttemptRow {
    completed_at: string | null;
    score_percent: number | string;
    user_id: string;
}

interface ParticipantProfileRow {
    id: string;
    platform_role: string | null;
}

const ATTEMPT_PAGE_SIZE = 1_000;
const PROFILE_BATCH_SIZE = 200;

function toScore(value: number | string) {
    const score = typeof value === "number" ? value : Number(value);
    return Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : null;
}

async function getPersonalMethodMastery(
    quizId: string,
    userId: string,
): Promise<MethodMastery | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("quiz_attempts")
        .select("user_id, score_percent, completed_at")
        .eq("quiz_id", quizId)
        .eq("user_id", userId)
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
        participantCount: 1,
        scorePercent: latest.score,
        scope: METHOD_MASTERY_SCOPE.personal,
        trend: comparison.trend,
    };
}

async function listCompletedQuizAttempts(quizId: string): Promise<CompletedQuizAttemptRow[]> {
    const supabase = createAdminClient();
    const attempts: CompletedQuizAttemptRow[] = [];

    for (let from = 0; ; from += ATTEMPT_PAGE_SIZE) {
        const { data, error } = await supabase
            .from("quiz_attempts")
            .select("user_id, score_percent, completed_at")
            .eq("quiz_id", quizId)
            .eq("status", "completed")
            .not("score_percent", "is", null)
            .order("completed_at", { ascending: false })
            .range(from, from + ATTEMPT_PAGE_SIZE - 1)
            .returns<CompletedQuizAttemptRow[]>();

        if (error) throw error;

        const page = data ?? [];
        attempts.push(...page);
        if (page.length < ATTEMPT_PAGE_SIZE) return attempts;
    }
}

async function listParticipantUserIds(userIds: string[]): Promise<Set<string>> {
    const supabase = createAdminClient();
    const participantUserIds = new Set<string>();

    for (let from = 0; from < userIds.length; from += PROFILE_BATCH_SIZE) {
        const batch = userIds.slice(from, from + PROFILE_BATCH_SIZE);
        const { data, error } = await supabase
            .from("profiles")
            .select("id, platform_role")
            .in("id", batch)
            .returns<ParticipantProfileRow[]>();

        if (error) throw error;

        for (const profile of data ?? []) {
            if (profile.platform_role !== PLATFORM_ROLE.admin) {
                participantUserIds.add(profile.id);
            }
        }
    }

    return participantUserIds;
}

async function getParticipantAverageMethodMastery(quizId: string): Promise<MethodMastery | null> {
    const rows = await listCompletedQuizAttempts(quizId);
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const participantUserIds = await listParticipantUserIds(userIds);
    const attempts = rows.flatMap<MethodMasteryAttemptScore>((attempt) => {
        if (!participantUserIds.has(attempt.user_id)) return [];

        const scorePercent = toScore(attempt.score_percent);
        return scorePercent === null
            ? []
            : [{
                  completedAt: attempt.completed_at,
                  scorePercent,
                  userId: attempt.user_id,
              }];
    });

    return calculateParticipantAverageMethodMastery(attempts);
}

export async function getMethodMastery(quizId: string): Promise<MethodMastery | null> {
    const context = await requireAuth();

    return isPlatformAdmin(context.platformRole)
        ? getParticipantAverageMethodMastery(quizId)
        : getPersonalMethodMastery(quizId, context.userId);
}
