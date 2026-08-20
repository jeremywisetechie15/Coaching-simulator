import { QUIZ_KIND, type QuizKind } from "@/features/evaluations/domain/quiz";

export interface MethodQuizSelectionCandidate {
    id: string;
    isSelectable?: boolean;
    kind: QuizKind;
    methodId: string | null;
}

export function isQuizAssignableAsMethodKnowledge(
    quiz: MethodQuizSelectionCandidate,
    methodId: string | null | undefined,
) {
    if (quiz.isSelectable === false) return false;
    if (quiz.kind === QUIZ_KIND.contextual) return quiz.methodId === null;

    return quiz.methodId === null || quiz.methodId === methodId;
}

export function getMethodKnowledgeQuizOptions<T extends MethodQuizSelectionCandidate>(
    quizzes: readonly T[],
    methodId: string | null | undefined,
) {
    return quizzes.filter((quiz) => isQuizAssignableAsMethodKnowledge(quiz, methodId));
}
