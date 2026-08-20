import { CONTENT_STATUS, type ContentStatus } from "@/features/content/domain";
import { QUIZ_KIND, type QuizKind } from "./quiz";

export const QUIZ_METHOD_ASSOCIATION_ERROR = {
    contextualMethodForbidden: "Un quiz contextuel ne peut pas être lié à une méthode.",
    methodRequired: "Un quiz de méthode doit être lié à une méthode.",
    methodStepWithoutMethod: "Un groupe ne peut pas cibler une étape sans méthode de référence.",
} as const;

export const QUIZ_METHOD_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE =
    "QUIZ_METHOD_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED";

export const QUIZ_METHOD_HISTORICAL_IMPACT_CONFIRMATION_MESSAGE =
    "Confirmez la modification du type ou de la méthode du quiz : des tentatives et des notes existent déjà.";

export interface QuizMethodAssociationState {
    methodId: string | null | undefined;
    quizKind: QuizKind | null | undefined;
    steps: readonly {
        id?: string | null;
        methodStepId: string | null | undefined;
    }[];
}

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
    if (quizKind === QUIZ_KIND.contextual) return false;

    return !method.methodKnowledgeQuizId || method.methodKnowledgeQuizId === currentQuizId;
}

export function getQuizMethodAssociationError(
    quizKind: QuizKind | null | undefined,
    methodId: string | null | undefined,
    status: ContentStatus | null | undefined,
) {
    if (quizKind === QUIZ_KIND.contextual && methodId) {
        return QUIZ_METHOD_ASSOCIATION_ERROR.contextualMethodForbidden;
    }

    if (
        quizKind === QUIZ_KIND.methodKnowledge
        && status === CONTENT_STATUS.published
        && !methodId
    ) {
        return QUIZ_METHOD_ASSOCIATION_ERROR.methodRequired;
    }

    return null;
}

export function normalizeQuizMethodId(
    quizKind: QuizKind | null | undefined,
    methodId: string | null | undefined,
) {
    if (quizKind === QUIZ_KIND.contextual) return null;

    return methodId ?? null;
}

export function getQuizMethodStepAssociationError(
    methodId: string | null | undefined,
    steps: readonly { methodStepId: string | null | undefined }[],
) {
    if (!methodId && steps.some((step) => Boolean(step.methodStepId))) {
        return QUIZ_METHOD_ASSOCIATION_ERROR.methodStepWithoutMethod;
    }

    return null;
}

export function hasQuizMethodAssociationChanged(
    current: QuizMethodAssociationState,
    next: QuizMethodAssociationState,
) {
    const snapshot = (state: QuizMethodAssociationState) => ({
        methodId: state.methodId ?? null,
        quizKind: state.quizKind ?? null,
        steps: state.steps.map((step, index) => ({
            id: step.id ?? `step-${index}`,
            methodStepId: step.methodStepId ?? null,
        })),
    });

    return JSON.stringify(snapshot(current)) !== JSON.stringify(snapshot(next));
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
