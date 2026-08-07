import { QUIZ_KIND, type QuizKind } from "./quiz";

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

export function getQuizMethodOptionsForKind<T extends QuizMethodSelectionCandidate>(
    methods: readonly T[],
    quizKind: QuizKind | null | undefined,
    currentQuizId?: string | null,
) {
    return methods.filter((method) =>
        isQuizMethodSelectableForKind(method, quizKind, currentQuizId),
    );
}
