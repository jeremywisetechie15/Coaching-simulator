import type { SupabaseClient } from "@supabase/supabase-js";
import {
    CONTENT_STATUS,
    isSelectableContent,
    type ContentStatus,
} from "@/features/content/domain";
import {
    QUIZ_KIND,
    isQuizMethodSelectableForKind,
} from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";
import { ConflictError } from "@/lib/server/errors";

interface QuizMethodRow {
    id: string;
    is_active: boolean;
    status: ContentStatus;
}

interface MethodKnowledgeQuizRow {
    id: string;
}

export async function assertQuizMethodSelection(
    supabase: SupabaseClient,
    input: Pick<SaveQuizDto, "methodId" | "quizKind">,
    currentQuizId?: string | null,
) {
    if (!input.methodId) {
        if (input.quizKind === QUIZ_KIND.methodKnowledge) {
            throw new ConflictError(
                "Un quiz principal doit être rattaché à une méthode disponible.",
            );
        }
        return;
    }

    const [methodResult, methodKnowledgeQuizResult] = await Promise.all([
        supabase
            .from("methods")
            .select("id, status, is_active")
            .eq("id", input.methodId)
            .maybeSingle<QuizMethodRow>(),
        supabase
            .from("quizzes")
            .select("id")
            .eq("method_id", input.methodId)
            .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
            .eq("is_active", true)
            .neq("status", CONTENT_STATUS.archived)
            .maybeSingle<MethodKnowledgeQuizRow>(),
    ]);

    if (methodResult.error) throw methodResult.error;
    if (methodKnowledgeQuizResult.error) throw methodKnowledgeQuizResult.error;

    const method = methodResult.data;
    if (!method || !isQuizMethodSelectableForKind({
        id: method.id,
        isSelectable: isSelectableContent(method.status, method.is_active),
        methodKnowledgeQuizId: methodKnowledgeQuizResult.data?.id ?? null,
    }, input.quizKind, currentQuizId)) {
        throw new ConflictError(
            input.quizKind === QUIZ_KIND.methodKnowledge
                ? "Cette méthode possède déjà un autre quiz principal ou n’est plus disponible."
                : "La méthode sélectionnée n’est plus disponible.",
        );
    }
}
