export const QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE =
    "Ce quiz possède déjà des tentatives. Seuls les champs texte et numériques existants peuvent être modifiés.";

export interface QuizAttemptLockedAttachment {
    deliveryType: "file" | "url";
    id: string | null;
    storageBucket: string | null;
    storagePath: string | null;
    type: string;
}

export interface QuizAttemptLockedChoice {
    id: string | null;
    isCorrect: boolean;
}

export interface QuizAttemptLockedQuestion {
    attachments: QuizAttemptLockedAttachment[];
    choices: QuizAttemptLockedChoice[];
    competenceId: string | null;
    dimension: string;
    dimensionItem: string | null;
    dimensionItemId: string | null;
    id: string | null;
    type: string;
}

export interface QuizAttemptLockedStep {
    competenceIds: string[];
    id: string | null;
    methodStepId: string | null;
    questions: QuizAttemptLockedQuestion[];
}

export interface QuizAttemptLockedConfiguration {
    assignedUserId: string | null;
    categories: string[];
    domain: string | null;
    groupId: string | null;
    hasAttemptLimit: boolean;
    methodId: string | null;
    organizationId: string | null;
    participation: string;
    quizKind: string;
    quizType: string;
    scope: string;
    steps: QuizAttemptLockedStep[];
}

export function hasQuizAttemptLockedConfigurationChanged(
    current: QuizAttemptLockedConfiguration,
    next: QuizAttemptLockedConfiguration,
) {
    return JSON.stringify(current) !== JSON.stringify(next);
}
