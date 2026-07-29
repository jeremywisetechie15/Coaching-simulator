import type { SupabaseClient } from "@supabase/supabase-js";
import {
    isSelectableContent,
    normalizeContentStatus,
} from "@/features/content/domain";
import { ConflictError, NotFoundError } from "@/lib/server/errors";

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

    if (!data) {
        throw new NotFoundError("Quiz introuvable.");
    }

    if (
        !isSelectableContent(
            normalizeContentStatus(data.status),
            data.is_active ?? true,
        )
    ) {
        throw new ConflictError("Publiez le quiz avant de démarrer une tentative.");
    }

    return data;
}
