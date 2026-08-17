export const QUIZ_ATTEMPT_EDIT_RESTRICTION_MESSAGE =
    "Ce quiz possède déjà des tentatives. Ses questions, réponses, compétences, ciblages et pièces jointes sont verrouillés ; son usage et ses rattachements de méthode restent corrigeables.";

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
    questions: QuizAttemptLockedQuestion[];
}

export interface QuizAttemptLockedConfiguration {
    assignedUserId: string | null;
    categories: string[];
    domain: string | null;
    groupId: string | null;
    hasAttemptLimit: boolean;
    organizationId: string | null;
    participation: string;
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
