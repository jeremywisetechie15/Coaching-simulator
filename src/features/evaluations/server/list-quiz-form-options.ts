import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import {
    QUIZ_KIND,
    type QuizMethodOption,
    type QuizOrganizationOption,
} from "@/features/evaluations/domain/quiz";
import { listMethodSelectionOptionsWithSteps } from "@/features/methods/server";
import { listOrganizationSelectionOptions } from "@/features/organizations/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface MethodKnowledgeQuizRow {
    id: string;
    method_id: string;
}

export async function listQuizMethodOptions({
    includeUnavailableIds = [],
}: {
    includeUnavailableIds?: readonly string[];
} = {}): Promise<QuizMethodOption[]> {
    await requireAdmin();
    const methods = await listMethodSelectionOptionsWithSteps({ includeUnavailableIds });
    if (methods.length === 0) return [];

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("quizzes")
        .select("id, method_id")
        .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
        .eq("is_active", true)
        .neq("status", CONTENT_STATUS.archived)
        .in("method_id", methods.map((method) => method.id))
        .returns<MethodKnowledgeQuizRow[]>();

    if (error) throw error;

    const quizIdByMethodId = new Map(
        (data ?? []).map((quiz) => [quiz.method_id, quiz.id]),
    );

    return methods.map((method) => ({
        ...method,
        methodKnowledgeQuizId: quizIdByMethodId.get(method.id) ?? null,
    }));
}

export async function listQuizOrganizationOptions(): Promise<QuizOrganizationOption[]> {
    const organizations = await listOrganizationSelectionOptions();

    return organizations.map((organization) => ({
        id: organization.id,
        isSelectable: organization.isSelectable,
        name: organization.name,
    }));
}
