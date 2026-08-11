import { QUIZ_KIND, type QuizKind } from "./quiz";

export const QUIZ_METHOD_ASSOCIATION_ERROR = {
    methodRequired: "Un quiz de méthode doit être lié à une méthode.",
} as const;

export interface QuizMethodSelectionCandidate {
    id: string;
    isSelectable?: boolean;
    methodKnowledgeQuizId: string | null;
}

export function isQuizMethodSelectableForKind(
    method: QuizMethodSelectionCandidate,
    quizKind: QuizKind | null | undefined,
    currentQuizId?: string | null,
) {
    if (method.isSelectable === false || !quizKind) return false;
    if (quizKind === QUIZ_KIND.contextual) return true;

    return !method.methodKnowledgeQuizId || method.methodKnowledgeQuizId === currentQuizId;
}

export function getQuizMethodAssociationError(
    quizKind: QuizKind | null | undefined,
    methodId: string | null | undefined,
) {
    if (quizKind === QUIZ_KIND.methodKnowledge && !methodId) {
        return QUIZ_METHOD_ASSOCIATION_ERROR.methodRequired;
    }

    return null;
}

export function normalizeQuizMethodId(
    _quizKind: QuizKind | null | undefined,
    methodId: string | null | undefined,
) {
    return methodId ?? null;
}

export function getQuizMethodOptionsForKind<T extends QuizMethodSelectionCandidate>(
    methods: readonly T[],
    quizKind: QuizKind | null | undefined,
    currentQuizId?: string | null,
) {
    return methods.filter((method) =>
        isQuizMethodSelectableForKind(method, quizKind, currentQuizId),
    );
}
