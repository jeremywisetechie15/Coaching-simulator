import {
    type RoleplayQuizAssignmentIssue,
    validateRoleplayQuizAssignments,
} from "@/features/roleplays/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { AppError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface QuizAssignmentRow {
    id: string;
    method_id: string | null;
    title: string | null;
}

function getQuizAssignmentIssueMessage(issue: RoleplayQuizAssignmentIssue) {
    const title = issue.title ? ` "${issue.title}"` : "";

    switch (issue.code) {
        case "method_required":
            return "Sélectionnez une méthode avant d'associer des quiz au roleplay.";
        case "quiz_linked_to_selected_method":
            return `Le quiz${title} est déjà associé à la méthode sélectionnée.`;
        case "quiz_linked_to_other_method":
            return `Le quiz${title} est déjà associé à une autre méthode.`;
        case "quiz_not_found":
            return "Un quiz sélectionné est introuvable.";
    }
}

export async function assertRoleplayQuizzesMatchMethod(input: SaveRoleplayDto) {
    const quizIds = [...new Set(input.quizIds)];

    if (quizIds.length === 0) return;

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("quizzes")
        .select("id, method_id, title")
        .in("id", quizIds);

    if (error) throw error;

    const issues = validateRoleplayQuizAssignments({
        methodId: input.methodId,
        quizIds,
        quizzes: ((data ?? []) as QuizAssignmentRow[]).map((quiz) => ({
            id: quiz.id,
            methodId: quiz.method_id,
            title: quiz.title,
        })),
    });

    if (issues.length > 0) {
        throw new AppError(getQuizAssignmentIssueMessage(issues[0]), 400, "VALIDATION_ERROR");
    }
}
