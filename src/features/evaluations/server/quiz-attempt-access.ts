import type { SupabaseClient } from "@supabase/supabase-js";
import { NotFoundError } from "@/lib/server/errors";

export interface QuizAttemptQuizRow {
    id: string;
    is_active?: boolean | null;
    max_attempts?: number | null;
    status?: string | null;
}

export async function getAccessibleQuizForAttempt(
    supabase: SupabaseClient,
    quizId: string,
): Promise<QuizAttemptQuizRow> {
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
