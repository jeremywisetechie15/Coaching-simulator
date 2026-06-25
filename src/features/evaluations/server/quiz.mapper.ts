import { CONTENT_STATUS, normalizeContentStatus } from "@/features/content/domain";
import {
    QUIZ_ATTACHMENT_TYPES,
    QUIZ_DIMENSIONS,
    QUIZ_KIND,
    QUIZ_KINDS,
    QUIZ_PARTICIPATION,
    QUIZ_PARTICIPATIONS,
    QUIZ_QUESTION_TYPES,
    QUIZ_TYPE,
    QUIZ_TYPES,
    QUIZ_VISIBILITY_SCOPE,
    QUIZ_VISIBILITY_SCOPES,
    type QuizAttachmentType,
    type QuizChoice,
    type QuizDetail,
    type QuizDimension,
    type QuizKind,
    type QuizListItem,
    type QuizParticipation,
    type QuizQuestion,
    type QuizQuestionAttachment,
    type QuizQuestionType,
    type QuizStep,
    type QuizType,
    type QuizVisibilityScope,
} from "@/features/evaluations/domain/quiz";

export interface QuizRow {
    assigned_user_id?: string | null;
    category?: string | null;
    created_at?: string | null;
    description?: string | null;
    domain?: string | null;
    duration_minutes?: number | null;
    group_id?: string | null;
    id: string;
    is_active?: boolean | null;
    max_attempts?: number | null;
    method_id?: string | null;
    method_name?: string | null;
    organization_id?: string | null;
    participation?: string | null;
    quiz_kind?: string | null;
    quiz_type?: string | null;
    status?: string | null;
    tags?: string[] | null;
    title: string;
    updated_at?: string | null;
    validation_threshold?: number | null;
    visibility_scope?: string | null;
}

export interface QuizStepRow {
    id: string;
    method_step_id?: string | null;
    name: string;
    quiz_id: string;
    step_order: number;
    weight?: number | null;
}

export interface QuizStepCompetencyRow {
    competence_id: string;
    step_id: string;
}

export interface QuizQuestionRow {
    competence_id?: string | null;
    dimension?: string | null;
    dimension_item?: string | null;
    dimension_item_id?: string | null;
    explanation?: string | null;
    id: string;
    points?: number | null;
    prompt: string;
    question_order: number;
    question_type?: string | null;
    step_id: string;
}

export interface QuizChoiceRow {
    choice_order: number;
    id: string;
    is_correct?: boolean | null;
    label: string;
    question_id: string;
}

export interface QuizAttachmentRow {
    attachment_order: number;
    attachment_type?: string | null;
    external_url?: string | null;
    id: string;
    label?: string | null;
    question_id: string;
    storage_bucket?: string | null;
    storage_path?: string | null;
}

function cleanArray(value: string[] | null | undefined) {
    return Array.isArray(value) ? value.filter((item) => item.trim().length > 0) : [];
}

function normalizeKind(value: string | null | undefined): QuizKind {
    return QUIZ_KINDS.includes(value as QuizKind) ? (value as QuizKind) : QUIZ_KIND.contextual;
}

function normalizeType(value: string | null | undefined): QuizType {
    return QUIZ_TYPES.includes(value as QuizType) ? (value as QuizType) : QUIZ_TYPE.knowledge;
}

function normalizeScope(value: string | null | undefined): QuizVisibilityScope {
    return QUIZ_VISIBILITY_SCOPES.includes(value as QuizVisibilityScope)
        ? (value as QuizVisibilityScope)
        : QUIZ_VISIBILITY_SCOPE.public;
}

function normalizeParticipation(value: string | null | undefined): QuizParticipation {
    return QUIZ_PARTICIPATIONS.includes(value as QuizParticipation)
        ? (value as QuizParticipation)
        : QUIZ_PARTICIPATION.optional;
}

function normalizeQuestionType(value: string | null | undefined): QuizQuestionType {
    return QUIZ_QUESTION_TYPES.includes(value as QuizQuestionType) ? (value as QuizQuestionType) : "QCU";
}

function normalizeDimension(value: string | null | undefined): QuizDimension {
    return QUIZ_DIMENSIONS.includes(value as QuizDimension) ? (value as QuizDimension) : "savoir";
}

function normalizeAttachmentType(value: string | null | undefined): QuizAttachmentType {
    return QUIZ_ATTACHMENT_TYPES.includes(value as QuizAttachmentType) ? (value as QuizAttachmentType) : "link";
}

export function mapQuizRowToListItem(row: QuizRow, questionCount = 0): QuizListItem {
    return {
        category: row.category ?? "",
        description: row.description ?? "",
        domain: row.domain ?? "",
        durationMinutes: row.duration_minutes ?? 30,
        id: row.id,
        isActive: row.is_active ?? true,
        kind: normalizeKind(row.quiz_kind),
        maxAttempts: row.max_attempts ?? 3,
        methodId: row.method_id ?? null,
        methodName: row.method_name ?? null,
        participation: normalizeParticipation(row.participation),
        questionCount,
        scope: normalizeScope(row.visibility_scope),
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
        tags: cleanArray(row.tags),
        title: row.title,
        type: normalizeType(row.quiz_type),
        updatedAt: row.updated_at ?? null,
        validationThreshold: row.validation_threshold ?? null,
    };
}

function mapChoiceRow(row: QuizChoiceRow): QuizChoice {
    return {
        id: row.id,
        isCorrect: row.is_correct ?? false,
        label: row.label,
        order: row.choice_order,
    };
}

function mapAttachmentRow(row: QuizAttachmentRow): QuizQuestionAttachment {
    const fallbackLabel = row.external_url ?? row.storage_path ?? "";

    return {
        externalUrl: row.external_url ?? "",
        id: row.id,
        label: row.label ?? fallbackLabel,
        order: row.attachment_order,
        storageBucket: row.storage_bucket ?? null,
        storagePath: row.storage_path ?? null,
        type: normalizeAttachmentType(row.attachment_type),
    };
}

function mapQuestionRow(
    row: QuizQuestionRow,
    choices: QuizChoice[] = [],
    attachments: QuizQuestionAttachment[] = [],
): QuizQuestion {
    return {
        attachments: attachments.slice().sort((a, b) => a.order - b.order),
        choices: choices.slice().sort((a, b) => a.order - b.order),
        competenceId: row.competence_id ?? "",
        dimension: normalizeDimension(row.dimension),
        dimensionItem: row.dimension_item ?? "",
        dimensionItemId: row.dimension_item_id ?? null,
        explanation: row.explanation ?? "",
        id: row.id,
        order: row.question_order,
        points: row.points ?? 1,
        prompt: row.prompt,
        type: normalizeQuestionType(row.question_type),
    };
}

function mapStepRow(
    row: QuizStepRow,
    competenceIds: string[] = [],
    questions: QuizQuestion[] = [],
): QuizStep {
    return {
        competenceIds,
        id: row.id,
        methodStepId: row.method_step_id ?? null,
        name: row.name,
        order: row.step_order,
        questions: questions.slice().sort((a, b) => a.order - b.order),
        weight: row.weight ?? 0,
    };
}

export function mapQuizRowsToDetail(
    row: QuizRow,
    steps: QuizStepRow[],
    competencies: QuizStepCompetencyRow[],
    questions: QuizQuestionRow[],
    choices: QuizChoiceRow[],
    attachments: QuizAttachmentRow[],
): QuizDetail {
    const normalizedChoicesByQuestionId = new Map<string, QuizChoice[]>();
    for (const choiceRow of choices) {
        const current = normalizedChoicesByQuestionId.get(choiceRow.question_id) ?? [];
        current.push(mapChoiceRow(choiceRow));
        normalizedChoicesByQuestionId.set(choiceRow.question_id, current);
    }

    const attachmentsByQuestionId = new Map<string, QuizQuestionAttachment[]>();
    for (const attachmentRow of attachments) {
        const current = attachmentsByQuestionId.get(attachmentRow.question_id) ?? [];
        current.push(mapAttachmentRow(attachmentRow));
        attachmentsByQuestionId.set(attachmentRow.question_id, current);
    }

    const questionsByStepId = new Map<string, QuizQuestion[]>();
    for (const questionRow of questions) {
        const current = questionsByStepId.get(questionRow.step_id) ?? [];
        current.push(
            mapQuestionRow(
                questionRow,
                normalizedChoicesByQuestionId.get(questionRow.id) ?? [],
                attachmentsByQuestionId.get(questionRow.id) ?? [],
            ),
        );
        questionsByStepId.set(questionRow.step_id, current);
    }

    const competenciesByStepId = new Map<string, string[]>();
    for (const competency of competencies) {
        const current = competenciesByStepId.get(competency.step_id) ?? [];
        current.push(competency.competence_id);
        competenciesByStepId.set(competency.step_id, current);
    }

    const orderedSteps = steps
        .slice()
        .sort((a, b) => a.step_order - b.step_order)
        .map((step) =>
            mapStepRow(
                step,
                competenciesByStepId.get(step.id) ?? [],
                questionsByStepId.get(step.id) ?? [],
            ),
        );

    return {
        ...mapQuizRowToListItem(
            row,
            orderedSteps.reduce((total, step) => total + step.questions.length, 0),
        ),
        assignedUserId: row.assigned_user_id ?? null,
        createdAt: row.created_at ?? null,
        groupId: row.group_id ?? null,
        organizationId: row.organization_id ?? null,
        steps: orderedSteps,
    };
}
