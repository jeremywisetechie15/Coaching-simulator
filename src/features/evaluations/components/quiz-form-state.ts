import { CONTENT_DOMAINS, type ContentStatus } from "@/features/content/domain";
import {
    DEFAULT_QUIZ_MAX_ATTEMPTS,
    QUIZ_KIND,
    QUIZ_EVALUATED_DIMENSION,
    type QuizAttachmentType,
    type QuizDetail,
    type QuizDimension,
    type QuizGroupOption,
    type QuizMethodOption,
    type QuizParticipation,
    type QuizQuestionType,
    type QuizType,
    type QuizUserOption,
    type QuizVisibilityScope,
} from "@/features/evaluations/domain";
import type { SaveQuizInput } from "@/features/evaluations/dto";
import {
    CONTENT_RESOURCE_DELIVERY_OPTIONS,
    type ContentResourceDeliveryType,
    getStoragePathFileName,
    inferContentUploadResourceType,
} from "@/lib/uploads/content-upload";

export const domainOptions = [...CONTENT_DOMAINS];

export const DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE = String(DEFAULT_QUIZ_MAX_ATTEMPTS);

export const attachmentTypeLabels: Record<QuizAttachmentType, string> = {
    audio: "Audio",
    document: "Document",
    image: "Image",
    link: "Lien",
    video: "Vidéo",
};

export const attachmentDeliveryOptions = CONTENT_RESOURCE_DELIVERY_OPTIONS;

export type QuizAttachmentDeliveryType = ContentResourceDeliveryType;

export interface QuizChoiceFormState {
    id: string;
    isCorrect: boolean;
    label: string;
}

export interface QuizAttachmentFormState {
    clientFileId: string;
    deliveryType: QuizAttachmentDeliveryType;
    externalUrl: string;
    file: File | null;
    id: string;
    label: string;
    storageBucket: string;
    storagePath: string;
    type: QuizAttachmentType;
    uploadedFileName: string;
    uploadedFileSizeBytes: number | null;
}

export interface QuizQuestionFormState {
    attachments: QuizAttachmentFormState[];
    choices: QuizChoiceFormState[];
    competenceId: string | null;
    dimension: QuizDimension;
    dimensionItem: string | null;
    dimensionItemId: string | null;
    explanation: string;
    id: string;
    points: string;
    prompt: string;
    type: QuizQuestionType;
}

export interface QuizStepFormState {
    collapsed: boolean;
    competenceIds: string[];
    id: string;
    methodStepId: string | null;
    name: string;
    questions: QuizQuestionFormState[];
    weight: string;
}

export interface QuizFormState {
    assignedUserId: string;
    category: string | null;
    description: string;
    domain: string | null;
    durationMinutes: string;
    groupId: string;
    maxAttempts: string | null;
    methodId: string | null;
    organizationId: string | null;
    participation: QuizParticipation;
    quizType: QuizType;
    scope: QuizVisibilityScope;
    steps: QuizStepFormState[];
    tags: string[];
    title: string;
    validationThreshold: string;
}

export function createFormId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function emptyChoice(label = ""): QuizChoiceFormState {
    return {
        id: createFormId(),
        isCorrect: false,
        label,
    };
}

export function emptyAttachment(type: QuizAttachmentType): QuizAttachmentFormState {
    return {
        clientFileId: "",
        deliveryType: type === "link" ? "url" : "file",
        externalUrl: "",
        file: null,
        id: createFormId(),
        label: "",
        storageBucket: "",
        storagePath: "",
        type,
        uploadedFileName: "",
        uploadedFileSizeBytes: null,
    };
}

export function emptyQuestion(): QuizQuestionFormState {
    return {
        attachments: [],
        choices: [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()],
        competenceId: null,
        dimension: QUIZ_EVALUATED_DIMENSION,
        dimensionItem: null,
        dimensionItemId: null,
        explanation: "",
        id: createFormId(),
        points: "1",
        prompt: "",
        type: "QCU",
    };
}

export function emptyStep(weight = "0"): QuizStepFormState {
    return {
        collapsed: false,
        competenceIds: [],
        id: createFormId(),
        methodStepId: null,
        name: "",
        // Une étape démarre sans question : on n'affiche que la sélection de
        // compétences + le bouton « Ajouter une question » (comme sur le site).
        questions: [],
        weight,
    };
}

function distributeStepWeights(stepCount: number) {
    if (stepCount <= 0) return [];

    const baseWeight = Math.floor(100 / stepCount);
    const remainder = 100 % stepCount;

    return Array.from({ length: stepCount }, (_, index) =>
        String(baseWeight + (index < remainder ? 1 : 0)),
    );
}

function hasCompleteMethodWeights(method: QuizMethodOption) {
    const totalWeight = method.steps.reduce((sum, step) => sum + (step.weight ?? 0), 0);

    return method.steps.length > 0 && totalWeight === 100;
}

export function createQuizStepsFromMethod(method: QuizMethodOption): QuizStepFormState[] {
    const orderedMethodSteps = method.steps.slice().sort((first, second) => first.order - second.order);
    const weights = hasCompleteMethodWeights(method)
        ? orderedMethodSteps.map((step) => String(step.weight ?? 0))
        : distributeStepWeights(orderedMethodSteps.length);

    return orderedMethodSteps.map((methodStep, index) => ({
        ...emptyStep(weights[index] ?? "0"),
        methodStepId: methodStep.id,
        name: methodStep.title,
    }));
}

export function textOrNull(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

export function integerFromText(value: string, fallback: number) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number) : fallback;
}

export function nullableIntegerFromText(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const number = Number(trimmed);
    return Number.isFinite(number) ? Math.round(number) : null;
}

export function cleanList(items: string[]) {
    return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function inferQuizAttachmentType(mimeType: string): Exclude<QuizAttachmentType, "link"> {
    const resourceType = inferContentUploadResourceType(mimeType);

    return resourceType === "image" || resourceType === "video" || resourceType === "audio"
        ? resourceType
        : "document";
}

export function normalizeChoicesForQuestionType(
    choices: QuizChoiceFormState[],
    type: QuizQuestionType,
) {
    if (type !== "QCU" || choices.length === 0) {
        return choices;
    }

    const firstCorrectIndex = choices.findIndex((choice) => choice.isCorrect);
    const selectedIndex = firstCorrectIndex >= 0 ? firstCorrectIndex : 0;

    return choices.map((choice, index) => ({
        ...choice,
        isCorrect: index === selectedIndex,
    }));
}

export function quizToFormState(
    quiz: QuizDetail | undefined,
    groupOptions: QuizGroupOption[],
    userOptions: QuizUserOption[],
): QuizFormState {
    if (!quiz) {
        return {
            assignedUserId: "",
            category: null,
            description: "",
            domain: null,
            durationMinutes: "30",
            groupId: "",
            maxAttempts: DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
            methodId: null,
            organizationId: null,
            participation: "optional",
            quizType: "knowledge",
            scope: "public",
            steps: [],
            tags: [],
            title: "",
            validationThreshold: "",
        };
    }

    const assignedUserId = quiz.assignedUserId ?? "";
    let groupId = quiz.groupId ?? "";
    let organizationId = quiz.organizationId;

    if (quiz.scope === "user" && assignedUserId) {
        const user = userOptions.find((option) => option.id === assignedUserId);
        if (user) {
            if (!groupId) groupId = user.groupIds[0] ?? "";
            if (!organizationId) organizationId = user.organizationIds[0] ?? null;
        }
    }

    if ((quiz.scope === "user" || quiz.scope === "group") && groupId) {
        const group = groupOptions.find((option) => option.id === groupId);
        if (group) organizationId = group.organizationId;
    }

    return {
        assignedUserId,
        category: textOrNull(quiz.category),
        description: quiz.description,
        domain: textOrNull(quiz.domain),
        durationMinutes: String(quiz.durationMinutes),
        groupId,
        maxAttempts: quiz.maxAttempts === null ? null : String(quiz.maxAttempts),
        methodId: quiz.methodId,
        organizationId,
        participation: quiz.participation,
        quizType: quiz.type,
        scope: quiz.scope,
        steps: quiz.steps.map((step) => ({
            collapsed: false,
            competenceIds: step.competenceIds,
            id: step.id,
            methodStepId: step.methodStepId,
            name: step.name,
            questions: step.questions.length
                ? step.questions.map((question) => ({
                      attachments: question.attachments.map((attachment) => ({
                          clientFileId: "",
                          deliveryType: attachment.storagePath ? "file" : "url",
                          externalUrl: attachment.externalUrl,
                          file: null,
                          id: attachment.id,
                          label: attachment.label,
                          storageBucket: attachment.storageBucket ?? "",
                          storagePath: attachment.storagePath ?? "",
                          type: attachment.type,
                          uploadedFileName: attachment.storagePath
                              ? attachment.label || getStoragePathFileName(attachment.storagePath)
                              : "",
                          uploadedFileSizeBytes: null,
                      })),
                      choices: question.choices.length
                          ? question.choices.map((choice) => ({
                                id: choice.id,
                                isCorrect: choice.isCorrect,
                                label: choice.label,
                            }))
                          : [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()],
                      competenceId: textOrNull(question.competenceId),
                      dimension: question.dimension,
                      dimensionItem: textOrNull(question.dimensionItem),
                      dimensionItemId: question.dimensionItemId,
                      explanation: question.explanation,
                      id: question.id,
                      points: String(question.points),
                      prompt: question.prompt,
                      type: question.type,
                  }))
                : [emptyQuestion()],
            weight: String(step.weight),
        })),
        tags: quiz.tags,
        title: quiz.title,
        validationThreshold: quiz.validationThreshold === null ? "" : String(quiz.validationThreshold),
    };
}

export function toSaveQuizInput(form: QuizFormState, status: ContentStatus): SaveQuizInput {
    return {
        assignedUserId: form.scope === "user" ? textOrNull(form.assignedUserId) : null,
        category: form.category ?? "",
        description: form.description,
        domain: form.domain ?? "",
        durationMinutes: integerFromText(form.durationMinutes, 30),
        groupId: form.scope === "group" ? textOrNull(form.groupId) : null,
        maxAttempts:
            form.maxAttempts === null
                ? null
                : integerFromText(form.maxAttempts, DEFAULT_QUIZ_MAX_ATTEMPTS),
        methodId: form.methodId,
        organizationId:
            form.scope === "organization" || form.scope === "group" ? form.organizationId : null,
        participation: form.participation,
        quizKind: form.methodId ? QUIZ_KIND.methodKnowledge : QUIZ_KIND.contextual,
        quizType: form.quizType,
        scope: form.scope,
        status,
        steps: form.steps.map((step) => ({
            competenceIds: cleanList(step.competenceIds),
            id: step.id,
            methodStepId: step.methodStepId,
            name: step.name,
            questions: step.questions.map((question) => ({
                attachments: question.attachments.map((attachment) => ({
                    clientFileId: attachment.deliveryType === "file" && attachment.file ? attachment.clientFileId : "",
                    externalUrl: attachment.deliveryType === "url" ? attachment.externalUrl : "",
                    id: attachment.id,
                    label:
                        attachment.label ||
                        attachment.externalUrl ||
                        attachment.file?.name ||
                        attachment.uploadedFileName ||
                        attachment.storagePath,
                    storageBucket:
                        attachment.deliveryType === "file" && !attachment.file ? attachment.storageBucket : "",
                    storagePath:
                        attachment.deliveryType === "file" && !attachment.file ? attachment.storagePath : "",
                    type:
                        attachment.deliveryType === "url"
                            ? attachment.type
                            : attachment.file
                                ? inferQuizAttachmentType(attachment.file.type)
                                : attachment.type,
                })),
                choices: normalizeChoicesForQuestionType(question.choices, question.type).map((choice) => ({
                    id: choice.id,
                    isCorrect: choice.isCorrect,
                    label: choice.label,
                })),
                competenceId: question.competenceId ?? "",
                dimension: question.dimension,
                dimensionItem: question.dimensionItem ?? "",
                dimensionItemId: question.dimensionItemId,
                explanation: question.explanation,
                id: question.id,
                points: integerFromText(question.points, 1),
                prompt: question.prompt,
                type: question.type,
            })),
            weight: integerFromText(step.weight, 0),
        })),
        tags: cleanList(form.tags),
        title: form.title,
        validationThreshold: nullableIntegerFromText(form.validationThreshold),
    };
}
