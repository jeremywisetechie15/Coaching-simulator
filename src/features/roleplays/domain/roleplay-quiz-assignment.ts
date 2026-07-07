import type { RoleplayQuizOption } from "./roleplay";

export interface RoleplayQuizAssignmentCandidate {
    id: string;
    methodId: string | null;
    title?: string | null;
}

export type RoleplayQuizAssignmentIssueCode =
    | "method_required"
    | "quiz_linked_to_selected_method"
    | "quiz_linked_to_other_method"
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

    return !quiz.methodId;
}

export function getAssignableRoleplayQuizOptions(
    quizOptions: RoleplayQuizOption[],
    methodId: string | null | undefined,
) {
    return quizOptions.filter((quiz) => isRoleplayQuizAssignableForMethod(quiz, methodId));
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

        if (!quiz.methodId) {
            continue;
        }

        issues.push({
            code: quiz.methodId === methodId ? "quiz_linked_to_selected_method" : "quiz_linked_to_other_method",
            quizId,
            title: quiz.title,
        });
    }

    return issues;
}
