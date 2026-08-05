import { QUIZ_KIND, type QuizKind } from "@/features/evaluations/domain";
import type { RoleplayQuizOption } from "./roleplay";

export interface RoleplayQuizAssignmentCandidate {
    id: string;
    kind: QuizKind;
    methodId: string | null;
    title?: string | null;
}

export type RoleplayQuizAssignmentIssueCode =
    | "method_required"
    | "quiz_linked_to_other_method"
    | "selected_method_knowledge_quiz"
    | "quiz_not_found";

export interface RoleplayQuizAssignmentIssue {
    code: RoleplayQuizAssignmentIssueCode;
    quizId: string;
    title?: string | null;
}

export function isRoleplayQuizAssignableForMethod(
    quiz: RoleplayQuizAssignmentCandidate,
    methodId: string | null | undefined,
) {
    if (!methodId) return false;

    if (quiz.methodId && quiz.methodId !== methodId) return false;

    return quiz.kind !== QUIZ_KIND.methodKnowledge;
}

export function getAssignableRoleplayQuizOptions(
    quizOptions: readonly RoleplayQuizOption[],
    methodId: string | null | undefined,
) {
    return quizOptions.filter((quiz) => isRoleplayQuizAssignableForMethod(quiz, methodId));
}

export function getRoleplayMethodKnowledgeQuizOption(
    quizOptions: readonly RoleplayQuizOption[],
    methodId: string | null | undefined,
) {
    if (!methodId) return null;

    return quizOptions.find(
        (quiz) => quiz.methodId === methodId && quiz.kind === QUIZ_KIND.methodKnowledge,
    ) ?? null;
}

export function validateRoleplayQuizAssignments({
    methodId,
    quizIds,
    quizzes,
}: {
    methodId: string | null | undefined;
    quizIds: string[];
    quizzes: RoleplayQuizAssignmentCandidate[];
}) {
    const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const issues: RoleplayQuizAssignmentIssue[] = [];

    for (const quizId of quizIds) {
        const quiz = quizzesById.get(quizId);

        if (!quiz) {
            issues.push({ code: "quiz_not_found", quizId });
            continue;
        }

        if (!methodId) {
            issues.push({ code: "method_required", quizId, title: quiz.title });
            continue;
        }

        if (quiz.methodId && quiz.methodId !== methodId) {
            issues.push({
                code: "quiz_linked_to_other_method",
                quizId,
                title: quiz.title,
            });
            continue;
        }

        if (quiz.kind === QUIZ_KIND.methodKnowledge) {
            issues.push({
                code: "selected_method_knowledge_quiz",
                quizId,
                title: quiz.title,
            });
        }
    }

    return issues;
}
