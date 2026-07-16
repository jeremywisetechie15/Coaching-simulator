import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server";
import type { QuizDetail } from "@/features/evaluations/domain/quiz";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import { mapDatabaseError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchQuizDetail } from "./quiz-query";
import {
    createAttachmentRows,
    createChoiceRows,
    createQuestionRows,
    createQuizUpdate,
    createStepCompetencyRows,
    createStepRows,
} from "./quiz.persistence";
import { materializeQuizAttachments } from "./save-quiz-children";
import {
    cleanupUploadedQuizStorageObjects,
    type QuizUploadFilesByClientId,
    type UploadedQuizStorageObject,
} from "./quiz-upload-files";
import { assertQuizLifecycle } from "./assert-quiz-lifecycle";

export async function updateQuiz(
    quizId: string,
    input: SaveQuizDto,
    uploadFilesByClientId: QuizUploadFilesByClientId = new Map(),
): Promise<QuizDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const uploadedObjects: UploadedQuizStorageObject[] = [];

    const { data: existingQuiz, error: existingError } = await adminSupabase
        .from("quizzes")
        .select("id, status")
        .eq("id", quizId)
        .maybeSingle<{ id: string; status: SaveQuizDto["status"] }>();

    if (existingError) {
        throw existingError;
    }

    if (!existingQuiz) {
        throw new NotFoundError("Quiz introuvable.");
    }

    await assertQuizLifecycle(adminSupabase, input, existingQuiz.status);

    try {
        const stepIdsByOrder = new Map(
            input.steps.map((step, index) => [index + 1, step.id ?? randomUUID()]),
        );
        const questionIdsByStepIdAndOrder = new Map<string, string>();
        input.steps.forEach((step, stepIndex) => {
            const stepId = stepIdsByOrder.get(stepIndex + 1);
            if (!stepId) return;
            step.questions.forEach((question, questionIndex) => {
                questionIdsByStepIdAndOrder.set(
                    `${stepId}:${questionIndex + 1}`,
                    question.id ?? randomUUID(),
                );
            });
        });
        const materializedInput = await materializeQuizAttachments(
            adminSupabase,
            quizId,
            input,
            stepIdsByOrder,
            questionIdsByStepIdAndOrder,
            uploadFilesByClientId,
            uploadedObjects,
            context.userId,
        );
        const steps = createStepRows(quizId, materializedInput).map((row) => ({
            ...row,
            id: stepIdsByOrder.get(row.step_order),
        }));
        const questions = createQuestionRows(materializedInput, stepIdsByOrder).map((row) => ({
            ...row,
            id: questionIdsByStepIdAndOrder.get(`${row.step_id}:${row.question_order}`),
        }));
        const choiceIds = materializedInput.steps.flatMap((step) =>
            step.questions.flatMap((question) =>
                question.choices
                    .filter((choice) => choice.label.trim().length > 0)
                    .map((choice) => choice.id ?? randomUUID())
            )
        );
        const choices = createChoiceRows(
            materializedInput,
            stepIdsByOrder,
            questionIdsByStepIdAndOrder,
        ).map((row, index) => ({ ...row, id: choiceIds[index] ?? randomUUID() }));
        const attachments = createAttachmentRows(
            materializedInput,
            stepIdsByOrder,
            questionIdsByStepIdAndOrder,
        ).map((row) => ({ ...row, id: row.id ?? randomUUID() }));
        const { error } = await adminSupabase.rpc("admin_update_quiz_aggregate", {
            p_attachments: attachments,
            p_choices: choices,
            p_competencies: createStepCompetencyRows(materializedInput, stepIdsByOrder),
            p_questions: questions,
            p_quiz: createQuizUpdate(materializedInput),
            p_quiz_id: quizId,
            p_steps: steps,
        });

        if (error) throw mapDatabaseError(error);
    } catch (error) {
        if (uploadedObjects.length > 0) {
            await cleanupUploadedQuizStorageObjects(adminSupabase, uploadedObjects);
        }

        throw error;
    }

    return fetchQuizDetail(adminSupabase, quizId);
}
