import type { SupabaseClient } from "@supabase/supabase-js";
import {
    METHOD_QUIZ_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE,
    METHOD_QUIZ_ROLEPLAY_LINK_CONFLICT_MESSAGE,
} from "@/features/methods/domain/method";
import { AppError, ConflictError } from "@/lib/server/errors";

const historicalImpactConfirmationMessage =
    "Confirmez la modification du quiz principal : des tentatives, des notes ou des sessions existent déjà.";

interface CurrentPrincipalQuizRow {
    id: string;
}

interface MethodQuizChangePolicyOptions {
    hasExistingUsage: boolean;
    historicalImpactConfirmed?: boolean;
    methodId?: string | null;
    nextQuizId: string | null;
}

async function getCurrentPrincipalQuizId(
    supabase: SupabaseClient,
    methodId: string | null | undefined,
) {
    if (!methodId) return null;

    const { data, error } = await supabase
        .from("quizzes")
        .select("id")
        .eq("method_id", methodId)
        .eq("quiz_kind", "method_knowledge")
        .eq("is_active", true)
        .neq("status", "archived")
        .maybeSingle<CurrentPrincipalQuizRow>();

    if (error) throw error;

    return data?.id ?? null;
}

async function hasQuizRoleplayLinks(
    supabase: SupabaseClient,
    quizId: string,
) {
    const { count, error } = await supabase
        .from("scenario_quizzes")
        .select("scenario_id", { count: "exact", head: true })
        .eq("quiz_id", quizId);

    if (error) throw error;

    return (count ?? 0) > 0;
}

async function hasAffectedQuizAttempts(
    supabase: SupabaseClient,
    quizIds: string[],
) {
    if (quizIds.length === 0) return false;

    const { count, error } = await supabase
        .from("quiz_attempts")
        .select("id", { count: "exact", head: true })
        .in("quiz_id", quizIds);

    if (error) throw error;

    return (count ?? 0) > 0;
}

export async function assertMethodQuizChangePolicy(
    supabase: SupabaseClient,
    {
        hasExistingUsage,
        historicalImpactConfirmed = false,
        methodId = null,
        nextQuizId,
    }: MethodQuizChangePolicyOptions,
) {
    const currentQuizId = await getCurrentPrincipalQuizId(supabase, methodId);
    if (currentQuizId === nextQuizId) return;

    if (nextQuizId && await hasQuizRoleplayLinks(supabase, nextQuizId)) {
        throw new ConflictError(METHOD_QUIZ_ROLEPLAY_LINK_CONFLICT_MESSAGE);
    }

    if (historicalImpactConfirmed) return;

    const affectedQuizIds = [...new Set(
        [currentQuizId, nextQuizId].filter((quizId): quizId is string => Boolean(quizId)),
    )];

    if (
        hasExistingUsage
        || await hasAffectedQuizAttempts(supabase, affectedQuizIds)
    ) {
        throw new AppError(
            historicalImpactConfirmationMessage,
            409,
            METHOD_QUIZ_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE,
        );
    }
}
