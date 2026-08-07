import { requireAuth } from "@/features/auth/server";
import { isSelectableContent } from "@/features/content/domain";
import { QUIZ_KIND, type QuizListItem, type QuizOption } from "@/features/evaluations/domain/quiz";
import { isQuizAssignableAsMethodKnowledge } from "@/features/methods/domain/method-quiz-selection";
import { createClient } from "@/lib/supabase/server";
import { fetchQuizList } from "./quiz-query";
import { getQuizById } from "./get-quiz-by-id";

interface ListQuizOptionsParams {
    availableForMethodId?: string;
    unassignedOnly?: boolean;
}

interface ListQuizSelectionOptionsParams extends ListQuizOptionsParams {
    includeUnavailableIds?: readonly string[];
}

function filterQuizOptions(quizzes: QuizListItem[], params: ListQuizOptionsParams) {
    return quizzes.filter((quiz) => {
        if (params.availableForMethodId) {
            return isQuizAssignableAsMethodKnowledge(quiz, params.availableForMethodId);
        }

        if (params.unassignedOnly) {
            return isQuizAssignableAsMethodKnowledge(quiz, null);
        }

        return true;
    });
}

function mapQuizOption(quiz: QuizListItem): QuizOption {
    return {
        id: quiz.id,
        kind: quiz.kind,
        methodId: quiz.methodId,
        questionCount: quiz.questionCount,
        title: quiz.title,
    };
}

export async function listQuizzes(): Promise<QuizListItem[]> {
    const context = await requireAuth();
    const supabase = await createClient();

    return fetchQuizList(supabase, context.userId);
}

export async function listQuizOptions(params: ListQuizOptionsParams = {}): Promise<QuizOption[]> {
    const quizzes = await listQuizzes();

    return filterQuizOptions(quizzes, params).map(mapQuizOption);
}

export async function listQuizSelectionOptions({
    includeUnavailableIds = [],
    ...params
}: ListQuizSelectionOptionsParams = {}): Promise<QuizOption[]> {
    const quizzes = await listQuizzes();
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    let currentIds = [...includeUnavailableIds];

    if (params.availableForMethodId) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("quizzes")
            .select("id")
            .eq("method_id", params.availableForMethodId)
            .eq("quiz_kind", QUIZ_KIND.methodKnowledge);

        if (error) throw error;
        currentIds = [
            ...currentIds,
            ...(data ?? []).flatMap((quiz: { id?: string | null }) => quiz.id ? [quiz.id] : []),
        ];
    }

    const uniqueCurrentIds = [...new Set(currentIds)];
    const missingCurrentIds = uniqueCurrentIds
        .filter((quizId) => quizId && !quizById.has(quizId));

    if (missingCurrentIds.length > 0) {
        const currentQuizzes = await Promise.all(missingCurrentIds.map((quizId) => getQuizById(quizId)));
        currentQuizzes.forEach((quiz) => quizById.set(quiz.id, quiz));
    }

    return filterQuizOptions([...quizById.values()], params)
        .filter((quiz) =>
            isSelectableContent(quiz.status, quiz.isActive) || uniqueCurrentIds.includes(quiz.id)
        )
        .map((quiz) => ({
            ...mapQuizOption(quiz),
            isSelectable: isSelectableContent(quiz.status, quiz.isActive),
        }));
}

export async function getMethodAssociatedQuizOption(
    methodId: string,
): Promise<QuizOption | null> {
    const quizzes = await listQuizSelectionOptions();

    return quizzes.find((quiz) => quiz.methodId === methodId && quiz.kind === QUIZ_KIND.methodKnowledge) ?? null;
}
