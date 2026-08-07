import type { SupabaseClient } from "@supabase/supabase-js";
import { isSelectableContent, type ContentStatus } from "@/features/content/domain";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { isQuizAssignableAsMethodKnowledge } from "@/features/methods/domain/method-quiz-selection";
import { AppError, NotFoundError } from "@/lib/server/errors";

interface QuizAssociationRow {
    id: string;
    is_active: boolean;
    quiz_kind: string | null;
    method_id: string | null;
    status: ContentStatus;
}

export async function syncMethodQuizAssociation(
    supabase: SupabaseClient,
    methodId: string,
    quizId: string | null,
) {
    if (quizId) {
        const { data: quiz, error } = await supabase
            .from("quizzes")
            .select("id, quiz_kind, method_id, status, is_active")
            .eq("id", quizId)
            .maybeSingle<QuizAssociationRow>();

        if (error) {
            throw error;
        }

        if (!quiz) {
            throw new NotFoundError("Quiz introuvable.");
        }

        if (!isQuizAssignableAsMethodKnowledge({
            id: quiz.id,
            isSelectable: isSelectableContent(quiz.status, quiz.is_active),
            kind: quiz.quiz_kind === QUIZ_KIND.methodKnowledge
                ? QUIZ_KIND.methodKnowledge
                : QUIZ_KIND.contextual,
            methodId: quiz.method_id,
        }, methodId)) {
            throw new AppError(
                quiz.method_id && quiz.method_id !== methodId
                    ? "Ce quiz est déjà associé à une autre méthode."
                    : "Ce quiz n’est pas disponible pour cette méthode.",
                409,
                quiz.method_id && quiz.method_id !== methodId
                    ? "QUIZ_ALREADY_LINKED_TO_METHOD"
                    : "QUIZ_NOT_AVAILABLE_FOR_METHOD",
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
