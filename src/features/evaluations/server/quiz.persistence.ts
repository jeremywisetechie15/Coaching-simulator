import type { SaveQuizDto } from "@/features/evaluations/dto/save-quiz.dto";

export const QUIZ_SELECT =
    "id, title, description, quiz_kind, quiz_type, domain, categories, method_id, duration_minutes, validation_threshold, max_attempts, tags, visibility_scope, organization_id, group_id, assigned_user_id, participation, status, is_active, created_by, created_at, updated_at";

export const QUIZ_STEP_SELECT =
    "id, quiz_id, method_step_id, step_order, name, weight";

export const QUIZ_STEP_COMPETENCY_SELECT =
    "step_id, competence_id";

export const QUIZ_QUESTION_SELECT =
    "id, step_id, question_order, question_type, prompt, competence_id, dimension, dimension_item, dimension_item_id, points, explanation";

export const QUIZ_CHOICE_SELECT =
    "id, question_id, choice_order, label, is_correct";

export const QUIZ_ATTACHMENT_SELECT =
    "id, question_id, attachment_order, attachment_type, label, external_url, storage_bucket, storage_path";

export function nullableText(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

function createQuizBasePayload(input: SaveQuizDto) {
    return {
        assigned_user_id: input.scope === "user" ? input.assignedUserId : null,
        categories: input.domain ? input.categories : [],
        description: nullableText(input.description),
        domain: nullableText(input.domain),
        duration_minutes: input.durationMinutes,
        group_id: input.scope === "group" ? input.groupId : null,
        max_attempts: input.maxAttempts,
        method_id: input.methodId,
        organization_id:
            input.scope === "organization" || input.scope === "group" ? input.organizationId : null,
        participation: input.participation,
        quiz_kind: input.quizKind,
        quiz_type: input.quizType,
        status: input.status,
        tags: input.tags,
        title: input.title,
        validation_threshold: input.validationThreshold,
        visibility_scope: input.scope,
    };
}

export function createQuizInsert(input: SaveQuizDto, createdBy: string) {
    const now = new Date().toISOString();

    return {
        ...createQuizBasePayload(input),
        created_at: now,
        created_by: createdBy,
        is_active: true,
        updated_at: now,
    };
}

export function createQuizUpdate(input: SaveQuizDto) {
    return {
        ...createQuizBasePayload(input),
        is_active: input.status !== "archived",
        updated_at: new Date().toISOString(),
    };
}

export function createStepRows(quizId: string, input: SaveQuizDto) {
    return input.steps.map((step, index) => ({
        method_step_id: step.methodStepId,
        name: step.name,
        quiz_id: quizId,
        step_order: index + 1,
        weight: step.weight,
    }));
}

export function createStepCompetencyRows(
    input: SaveQuizDto,
    stepIdsByOrder: Map<number, string>,
) {
    return input.steps.flatMap((step, index) => {
        const stepId = stepIdsByOrder.get(index + 1);
        if (!stepId) return [];

        return step.competenceIds.map((competenceId) => ({
            competence_id: competenceId,
            step_id: stepId,
        }));
    });
}

export function createQuestionRows(
    input: SaveQuizDto,
    stepIdsByOrder: Map<number, string>,
) {
    return input.steps.flatMap((step, stepIndex) => {
        const stepId = stepIdsByOrder.get(stepIndex + 1);
        if (!stepId) return [];

        return step.questions.map((question, questionIndex) => ({
            competence_id: nullableText(question.competenceId),
            dimension: question.dimension,
            dimension_item: nullableText(question.dimensionItem),
            dimension_item_id: question.dimensionItemId,
            explanation: nullableText(question.explanation),
            points: question.points,
            prompt: question.prompt,
            question_order: questionIndex + 1,
            question_type: question.type,
            step_id: stepId,
        }));
    });
}

export function createChoiceRows(
    input: SaveQuizDto,
    stepIdsByOrder: Map<number, string>,
    questionIdsByStepIdAndOrder: Map<string, string>,
) {
    return input.steps.flatMap((step, stepIndex) => {
        const stepId = stepIdsByOrder.get(stepIndex + 1);
        if (!stepId) return [];

        return step.questions.flatMap((question, questionIndex) => {
            const questionId = questionIdsByStepIdAndOrder.get(`${stepId}:${questionIndex + 1}`);
            if (!questionId) return [];

            return question.choices
                .filter((choice) => choice.label.trim().length > 0)
                .map((choice, choiceIndex) => ({
                    choice_order: choiceIndex + 1,
                    is_correct: choice.isCorrect,
                    label: choice.label,
                    question_id: questionId,
                }));
        });
    });
}

export function createAttachmentRows(
    input: SaveQuizDto,
    stepIdsByOrder: Map<number, string>,
    questionIdsByStepIdAndOrder: Map<string, string>,
) {
    return input.steps.flatMap((step, stepIndex) => {
        const stepId = stepIdsByOrder.get(stepIndex + 1);
        if (!stepId) return [];

        return step.questions.flatMap((question, questionIndex) => {
            const questionId = questionIdsByStepIdAndOrder.get(`${stepId}:${questionIndex + 1}`);
            if (!questionId) return [];

            return question.attachments
                .filter(
                    (attachment) =>
                        attachment.externalUrl.trim().length > 0 ||
                        (attachment.storageBucket.trim().length > 0 &&
                            attachment.storagePath.trim().length > 0),
                )
                .map((attachment, attachmentIndex) => ({
                    attachment_order: attachmentIndex + 1,
                    attachment_type: attachment.type,
                    external_url: nullableText(attachment.externalUrl),
                    id: attachment.id,
                    label: nullableText(attachment.label),
                    question_id: questionId,
                    storage_bucket: nullableText(attachment.storageBucket),
                    storage_path: nullableText(attachment.storagePath),
                }));
        });
    });
}
