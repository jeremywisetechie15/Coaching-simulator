import type { SupabaseClient } from "@supabase/supabase-js";
import { removeContent, type ContentStorageObject } from "@/features/content/server";

async function loadQuizStorageObjects(
    supabase: SupabaseClient,
    quizId: string,
): Promise<ContentStorageObject[]> {
    const { data: steps, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("id")
        .eq("quiz_id", quizId)
        .returns<Array<{ id: string }>>();
    if (stepsError) throw stepsError;

    const stepIds = (steps ?? []).map(({ id }) => id);
    if (stepIds.length === 0) return [];

    const { data: questions, error: questionsError } = await supabase
        .from("quiz_questions")
        .select("id")
        .in("step_id", stepIds)
        .returns<Array<{ id: string }>>();
    if (questionsError) throw questionsError;

    const questionIds = (questions ?? []).map(({ id }) => id);
    if (questionIds.length === 0) return [];

    const { data: attachments, error: attachmentsError } = await supabase
        .from("quiz_question_attachments")
        .select("storage_bucket, storage_path")
        .in("question_id", questionIds)
        .returns<Array<{ storage_bucket: string | null; storage_path: string | null }>>();
    if (attachmentsError) throw attachmentsError;

    return (attachments ?? []).flatMap(({ storage_bucket: bucket, storage_path: path }) =>
        bucket && path ? [{ bucket, path }] : [],
    );
}

export async function removeQuiz(quizId: string) {
    return removeContent({
        archiveChanges: { is_active: false },
        dependencyChecks: [
            { column: "quiz_id", table: "scenario_quizzes" },
            { column: "quiz_id", table: "quiz_attempts" },
            { column: "quiz_id", table: "quiz_user_assignments" },
        ],
        entityId: quizId,
        entityLabel: "Quiz",
        loadStorageObjects: loadQuizStorageObjects,
        table: "quizzes",
    });
}
