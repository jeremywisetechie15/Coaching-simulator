import type { SupabaseClient } from "@supabase/supabase-js";
import {
    CONTENT_STATUS,
    isSelectableContent,
    type ContentStatus,
} from "@/features/content/domain";
import {
    getQuizMethodAssociationError,
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

interface MethodStepRow {
    id: string;
}

export interface QuizMethodSelectionValidationOptions {
    /** Exact draft method created by the same internal duplication operation. */
    allowedDraftMethodId?: string | null;
}

export async function assertQuizMethodSelection(
    supabase: SupabaseClient,
    input: Pick<SaveQuizDto, "methodId" | "quizKind" | "steps">,
    currentQuizId?: string | null,
    { allowedDraftMethodId = null }: QuizMethodSelectionValidationOptions = {},
) {
    const methodAssociationError = getQuizMethodAssociationError(
        input.quizKind,
        input.methodId,
    );
    if (methodAssociationError) {
        throw new ConflictError(methodAssociationError);
    }

    const methodStepIds = Array.from(new Set(
        input.steps.flatMap((step) => step.methodStepId ? [step.methodStepId] : []),
    ));

    if (!input.methodId) {
        if (methodStepIds.length > 0) {
            throw new ConflictError(
                "Un groupe ne peut pas cibler une étape sans méthode de référence.",
            );
        }
        return;
    }

    const methodId = input.methodId!;

    const [methodResult, methodKnowledgeQuizResult] = await Promise.all([
        supabase
            .from("methods")
            .select("id, status, is_active")
            .eq("id", methodId)
            .maybeSingle<QuizMethodRow>(),
        supabase
            .from("quizzes")
            .select("id")
            .eq("method_id", methodId)
            .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
            .eq("is_active", true)
            .neq("status", CONTENT_STATUS.archived)
            .maybeSingle<MethodKnowledgeQuizRow>(),
    ]);

    if (methodResult.error) throw methodResult.error;
    if (methodKnowledgeQuizResult.error) throw methodKnowledgeQuizResult.error;

    const method = methodResult.data;
    const isAllowedDraftMethod = (
        method?.id === allowedDraftMethodId
        && method.status === CONTENT_STATUS.draft
        && method.is_active
    );
    if (!method || !isQuizMethodSelectableForKind({
        id: method.id,
        isSelectable: allowedDraftMethodId
            ? isAllowedDraftMethod
            : isSelectableContent(method.status, method.is_active),
        methodKnowledgeQuizId: methodKnowledgeQuizResult.data?.id ?? null,
    }, input.quizKind, currentQuizId)) {
        throw new ConflictError(
            input.quizKind === QUIZ_KIND.methodKnowledge
                ? "Cette méthode possède déjà un autre quiz principal ou n’est plus disponible."
                : "La méthode sélectionnée n’est plus disponible.",
        );
    }

    if (methodStepIds.length === 0) return;

    const { data: methodSteps, error: methodStepsError } = await supabase
        .from("method_steps")
        .select("id")
        .eq("method_id", methodId)
        .in("id", methodStepIds)
        .returns<MethodStepRow[]>();

    if (methodStepsError) throw methodStepsError;

    const validMethodStepIds = new Set((methodSteps ?? []).map((step) => step.id));
    if (methodStepIds.some((methodStepId) => !validMethodStepIds.has(methodStepId))) {
        throw new ConflictError(
            "Une étape sélectionnée n’appartient pas à la méthode du quiz.",
        );
    }
}
