import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";
import type { QuizQuestionRow, QuizStepRow } from "./quiz.mapper";
import {
    materializeQuizAttachmentUpload,
    type QuizUploadFilesByClientId,
    type UploadedQuizStorageObject,
} from "./quiz-upload-files";
import {
    createAttachmentRows,
    createChoiceRows,
    createQuestionRows,
    createStepCompetencyRows,
    createStepRows,
    QUIZ_QUESTION_SELECT,
    QUIZ_STEP_SELECT,
} from "./quiz.persistence";

export async function replaceQuizChildren(
    supabase: SupabaseClient,
    quizId: string,
    input: SaveQuizDto,
    uploadFilesByClientId: QuizUploadFilesByClientId = new Map(),
    uploadedObjects: UploadedQuizStorageObject[] = [],
    ownerUserId: string | null = null,
) {
    const { error: deleteError } = await supabase
        .from("quiz_steps")
        .delete()
        .eq("quiz_id", quizId);

    if (deleteError) {
        throw deleteError;
    }

    const stepRowsToInsert = createStepRows(quizId, input);
    if (stepRowsToInsert.length === 0) {
        return;
    }

    const { data: stepRows, error: stepsError } = await supabase
        .from("quiz_steps")
        .insert(stepRowsToInsert)
        .select(QUIZ_STEP_SELECT)
        .order("step_order", { ascending: true });

    if (stepsError) {
        throw stepsError;
    }

    const savedSteps = (stepRows ?? []) as QuizStepRow[];
    const stepIdsByOrder = new Map(savedSteps.map((step) => [step.step_order, step.id]));
    const competencyRowsToInsert = createStepCompetencyRows(input, stepIdsByOrder);

    if (competencyRowsToInsert.length > 0) {
        const { error } = await supabase
            .from("quiz_step_competencies")
            .insert(competencyRowsToInsert);

        if (error) {
            throw error;
        }
    }

    const questionRowsToInsert = createQuestionRows(input, stepIdsByOrder);
    if (questionRowsToInsert.length === 0) {
        return;
    }

    const { data: questionRows, error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionRowsToInsert)
        .select(QUIZ_QUESTION_SELECT)
        .order("question_order", { ascending: true });

    if (questionsError) {
        throw questionsError;
    }

    const savedQuestions = (questionRows ?? []) as QuizQuestionRow[];
    const questionIdsByStepIdAndOrder = new Map(
        savedQuestions.map((question) => [`${question.step_id}:${question.question_order}`, question.id]),
    );
    const choiceRowsToInsert = createChoiceRows(input, stepIdsByOrder, questionIdsByStepIdAndOrder);
    const materializedInput = await materializeQuizAttachments(
        supabase,
        quizId,
        input,
        stepIdsByOrder,
        questionIdsByStepIdAndOrder,
        uploadFilesByClientId,
        uploadedObjects,
        ownerUserId,
    );
    const attachmentRowsToInsert = createAttachmentRows(
        materializedInput,
        stepIdsByOrder,
        questionIdsByStepIdAndOrder,
    );

    if (choiceRowsToInsert.length > 0) {
        const { error } = await supabase
            .from("quiz_question_choices")
            .insert(choiceRowsToInsert);

        if (error) {
            throw error;
        }
    }

    if (attachmentRowsToInsert.length > 0) {
        const { error } = await supabase
            .from("quiz_question_attachments")
            .insert(attachmentRowsToInsert);

        if (error) {
            throw error;
        }
    }
}

export async function materializeQuizAttachments(
    supabase: SupabaseClient,
    quizId: string,
    input: SaveQuizDto,
    stepIdsByOrder: Map<number, string>,
    questionIdsByStepIdAndOrder: Map<string, string>,
    uploadFilesByClientId: QuizUploadFilesByClientId,
    uploadedObjects: UploadedQuizStorageObject[],
    ownerUserId: string | null,
): Promise<SaveQuizDto> {
    if (uploadFilesByClientId.size === 0) {
        return input;
    }

    const steps: SaveQuizDto["steps"] = [];

    for (const [stepIndex, step] of input.steps.entries()) {
        const stepId = stepIdsByOrder.get(stepIndex + 1);
        const questions: SaveQuizDto["steps"][number]["questions"] = [];

        for (const [questionIndex, question] of step.questions.entries()) {
            const questionId = stepId
                ? questionIdsByStepIdAndOrder.get(`${stepId}:${questionIndex + 1}`)
                : null;
            const attachments: SaveQuizDto["steps"][number]["questions"][number]["attachments"] = [];

            for (const attachment of question.attachments) {
                if (!questionId) {
                    attachments.push(attachment);
                    continue;
                }

                attachments.push(
                    await materializeQuizAttachmentUpload(
                        supabase,
                        quizId,
                        questionId,
                        attachment,
                        uploadFilesByClientId,
                        uploadedObjects,
                        ownerUserId,
                    ),
                );
            }

            questions.push({
                ...question,
                attachments,
            });
        }

        steps.push({
            ...step,
            questions,
        });
    }

    return {
        ...input,
        steps,
    };
}
