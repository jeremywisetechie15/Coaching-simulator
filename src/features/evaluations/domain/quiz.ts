import {
    CONTENT_STATUS_LABELS,
    CONTENT_VISIBILITY_SCOPE,
    CONTENT_VISIBILITY_SCOPE_LABELS,
    CONTENT_VISIBILITY_SCOPES,
    type ContentStatus,
    type ContentVisibilityScope,
} from "@/features/content/domain";

export const QUIZ_KIND = {
    contextual: "contextual",
    methodKnowledge: "method_knowledge",
} as const;

export const QUIZ_KINDS = [QUIZ_KIND.methodKnowledge, QUIZ_KIND.contextual] as const;

export type QuizKind = (typeof QUIZ_KINDS)[number];

export const QUIZ_KIND_LABELS: Record<QuizKind, string> = {
    [QUIZ_KIND.contextual]: "Quiz contextuel",
    [QUIZ_KIND.methodKnowledge]: "Quiz de méthode",
};

export const QUIZ_TYPE = {
    knowledge: "knowledge",
    selfAssessment: "self_assessment",
} as const;

export const QUIZ_TYPES = [QUIZ_TYPE.knowledge, QUIZ_TYPE.selfAssessment] as const;

export type QuizType = (typeof QUIZ_TYPES)[number];

export const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
    [QUIZ_TYPE.knowledge]: "Quiz de Connaissance",
    [QUIZ_TYPE.selfAssessment]: "Quiz d'Auto-Positionnement",
};

export const QUIZ_VISIBILITY_SCOPE = CONTENT_VISIBILITY_SCOPE;

export const QUIZ_VISIBILITY_SCOPES = CONTENT_VISIBILITY_SCOPES;

export type QuizVisibilityScope = ContentVisibilityScope;

export const QUIZ_VISIBILITY_SCOPE_LABELS = CONTENT_VISIBILITY_SCOPE_LABELS;

export const QUIZ_PARTICIPATION = {
    mandatory: "mandatory",
    optional: "optional",
} as const;

export const QUIZ_PARTICIPATIONS = [QUIZ_PARTICIPATION.optional, QUIZ_PARTICIPATION.mandatory] as const;

export type QuizParticipation = (typeof QUIZ_PARTICIPATIONS)[number];

export const QUIZ_PARTICIPATION_LABELS: Record<QuizParticipation, string> = {
    [QUIZ_PARTICIPATION.mandatory]: "Obligatoire",
    [QUIZ_PARTICIPATION.optional]: "Optionnel",
};

export const QUIZ_QUESTION_TYPES = ["QCU", "QCM"] as const;

export type QuizQuestionType = (typeof QUIZ_QUESTION_TYPES)[number];

export const QUIZ_QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
    QCM: "QCM (choix multiples)",
    QCU: "QCU (choix unique)",
};

export const QUIZ_DIMENSIONS = ["savoir", "savoir_faire", "savoir_etre"] as const;

export type QuizDimension = (typeof QUIZ_DIMENSIONS)[number];

export const QUIZ_DIMENSION_LABELS: Record<QuizDimension, string> = {
    savoir: "Savoir",
    savoir_etre: "Savoir-être",
    savoir_faire: "Savoir-faire",
};

export const QUIZ_ATTACHMENT_TYPES = ["link", "image", "video", "document"] as const;

export type QuizAttachmentType = (typeof QUIZ_ATTACHMENT_TYPES)[number];

export interface QuizMethodStepOption {
    id: string;
    order: number;
    title: string;
    weight: number | null;
}

export interface QuizMethodOption {
    id: string;
    name: string;
    shortName: string;
    steps: QuizMethodStepOption[];
}

export interface QuizOrganizationOption {
    id: string;
    name: string;
}

export interface QuizGroupOption {
    id: string;
    name: string;
    organizationId: string;
}

export interface QuizUserOption {
    groupIds: string[];
    id: string;
    name: string;
    organizationIds: string[];
}

export interface QuizOption {
    id: string;
    methodId: string | null;
    questionCount: number;
    title: string;
}

export interface QuizChoice {
    id: string;
    isCorrect: boolean;
    label: string;
    order: number;
}

export interface QuizQuestionAttachment {
    externalUrl: string;
    id: string;
    label: string;
    order: number;
    storageBucket?: string | null;
    storagePath?: string | null;
    type: QuizAttachmentType;
}

export interface QuizQuestion {
    attachments: QuizQuestionAttachment[];
    choices: QuizChoice[];
    competenceId: string;
    dimension: QuizDimension;
    dimensionItem: string;
    dimensionItemId: string | null;
    explanation: string;
    id: string;
    order: number;
    points: number;
    prompt: string;
    type: QuizQuestionType;
}

export interface QuizStep {
    competenceIds: string[];
    id: string;
    methodStepId: string | null;
    name: string;
    order: number;
    questions: QuizQuestion[];
    weight: number;
}

export interface QuizListItem {
    category: string;
    description: string;
    domain: string;
    durationMinutes: number;
    id: string;
    isActive: boolean;
    kind: QuizKind;
    maxAttempts: number;
    methodId: string | null;
    methodName: string | null;
    participation: QuizParticipation;
    questionCount: number;
    scope: QuizVisibilityScope;
    status: ContentStatus;
    tags: string[];
    title: string;
    type: QuizType;
    updatedAt: string | null;
    validationThreshold: number | null;
}

export interface QuizDetail extends QuizListItem {
    assignedUserId: string | null;
    createdAt: string | null;
    groupId: string | null;
    organizationId: string | null;
    steps: QuizStep[];
}

export function getQuizStatusLabel(status: ContentStatus) {
    return CONTENT_STATUS_LABELS[status];
}

export function getQuizKindLabel(kind: QuizKind) {
    return QUIZ_KIND_LABELS[kind];
}

export function getQuizTypeLabel(type: QuizType) {
    return QUIZ_TYPE_LABELS[type];
}

export function getQuizScopeLabel(scope: QuizVisibilityScope) {
    return QUIZ_VISIBILITY_SCOPE_LABELS[scope];
}

export function getQuizQuestionCount(quiz: Pick<QuizDetail, "steps"> | { questionCount: number }) {
    if ("questionCount" in quiz) {
        return quiz.questionCount;
    }

    return quiz.steps.reduce((total, step) => total + step.questions.length, 0);
}

export function getQuizCompetenceCount(quiz: Pick<QuizDetail, "steps">) {
    const competenceIds = new Set<string>();

    for (const step of quiz.steps) {
        step.competenceIds.forEach((competenceId) => competenceIds.add(competenceId));
        step.questions.forEach((question) => {
            if (question.competenceId) {
                competenceIds.add(question.competenceId);
            }
        });
    }

    return competenceIds.size;
}

export function scoreQuizAnswers(
    quiz: Pick<QuizDetail, "steps" | "validationThreshold">,
    selectedChoiceIdsByQuestionId: Record<string, string[]>,
) {
    const sections = quiz.steps.map((step) => {
        const maxPoints = step.questions.reduce((sum, question) => sum + question.points, 0);
        const earnedPoints = step.questions.reduce((sum, question) => {
            const selected = selectedChoiceIdsByQuestionId[question.id] ?? [];
            const correct = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
            const isCorrect =
                selected.length === correct.length && correct.every((choiceId) => selected.includes(choiceId));

            return sum + (isCorrect ? question.points : 0);
        }, 0);
        const score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

        return {
            earnedPoints,
            maxPoints,
            score,
            stepId: step.id,
            weight: step.weight,
        };
    });

    const totalWeight = sections.reduce((sum, section) => sum + section.weight, 0);
    const totalMaxPoints = sections.reduce((sum, section) => sum + section.maxPoints, 0);
    const totalEarnedPoints = sections.reduce((sum, section) => sum + section.earnedPoints, 0);
    const score =
        totalWeight > 0
            ? Math.round(sections.reduce((sum, section) => sum + section.score * section.weight, 0) / totalWeight)
            : totalMaxPoints > 0
              ? Math.round((totalEarnedPoints / totalMaxPoints) * 100)
              : 0;

    return {
        passed: score >= (quiz.validationThreshold ?? 70),
        score,
        sections,
        totalEarnedPoints,
        totalMaxPoints,
    };
}
