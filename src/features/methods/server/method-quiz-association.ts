import type { SupabaseClient } from "@supabase/supabase-js";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { AppError, NotFoundError } from "@/lib/server/errors";

interface QuizAssociationRow {
    id: string;
    quiz_kind: string | null;
    method_id: string | null;
}

export async function syncMethodQuizAssociation(
    supabase: SupabaseClient,
    methodId: string,
    quizId: string | null,
) {
    if (quizId) {
        const { data: quiz, error } = await supabase
            .from("quizzes")
            .select("id, quiz_kind, method_id")
            .eq("id", quizId)
            .maybeSingle<QuizAssociationRow>();

        if (error) {
            throw error;
        }

        if (!quiz) {
            throw new NotFoundError("Quiz introuvable.");
        }

        if (quiz.method_id && quiz.method_id !== methodId) {
            throw new AppError(
                "Ce quiz est déjà associé à une autre méthode.",
                409,
                "QUIZ_ALREADY_LINKED_TO_METHOD",
            );
        }
    }

    let detachQuery = supabase
        .from("quizzes")
        .update({ method_id: null, quiz_kind: QUIZ_KIND.contextual })
        .eq("method_id", methodId)
        .eq("quiz_kind", QUIZ_KIND.methodKnowledge);

    if (quizId) {
        detachQuery = detachQuery.neq("id", quizId);
    }

    const { error: detachError } = await detachQuery;
    if (detachError) {
        throw detachError;
    }

    if (!quizId) {
        return;
    }

    const { error: attachError } = await supabase
        .from("quizzes")
        .update({ method_id: methodId, quiz_kind: QUIZ_KIND.methodKnowledge })
        .eq("id", quizId);

    if (attachError) {
        throw attachError;
    }
}
