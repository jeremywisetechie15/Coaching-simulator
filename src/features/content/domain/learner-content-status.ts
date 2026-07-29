export const LEARNER_CONTENT_STATUS = {
    completed: "completed",
    retry: "retry",
    todo: "todo",
    validated: "validated",
} as const;

export type LearnerContentStatus =
    (typeof LEARNER_CONTENT_STATUS)[keyof typeof LEARNER_CONTENT_STATUS];

export const LEARNER_CONTENT_STATUS_LABELS: Record<LearnerContentStatus, string> = {
    completed: "Réalisé",
    retry: "À retravailler",
    todo: "À faire",
    validated: "Validé",
};

export const LEARNER_CONTENT_STATUS_FILTER = {
    all: "all",
    completed: LEARNER_CONTENT_STATUS.completed,
    retry: LEARNER_CONTENT_STATUS.retry,
    todo: LEARNER_CONTENT_STATUS.todo,
    validated: LEARNER_CONTENT_STATUS.validated,
} as const;

export type LearnerContentStatusFilter =
    (typeof LEARNER_CONTENT_STATUS_FILTER)[keyof typeof LEARNER_CONTENT_STATUS_FILTER];

const LEARNER_CONTENT_STATUS_FILTER_VALUES = Object.values(LEARNER_CONTENT_STATUS_FILTER);

export const LEARNER_CONTENT_STATUS_FILTER_OPTIONS = [
    { label: "Tous les statuts", value: LEARNER_CONTENT_STATUS_FILTER.all },
    { label: "Réalisés", value: LEARNER_CONTENT_STATUS_FILTER.completed },
    { label: "À faire", value: LEARNER_CONTENT_STATUS_FILTER.todo },
    { label: "Validés", value: LEARNER_CONTENT_STATUS_FILTER.validated },
    { label: "À retravailler", value: LEARNER_CONTENT_STATUS_FILTER.retry },
] as const;

export function isLearnerContentStatusFilter(
    value: string | null | undefined,
): value is LearnerContentStatusFilter {
    return LEARNER_CONTENT_STATUS_FILTER_VALUES.includes(value as LearnerContentStatusFilter);
}

interface ResolveLearnerContentStatusInput {
    bestScore: number | null;
    hasCompleted: boolean;
    validationThreshold: number;
}

interface LearnerContentProgressDefinition {
    id: string;
    validationThreshold: number;
}

interface CompletedLearnerContentAttempt {
    contentId: string;
    score: number | null;
}

export interface LearnerContentProgress {
    bestScore: number | null;
    completedCount: number;
    status: LearnerContentStatus;
}

export function resolveLearnerContentStatus({
    bestScore,
    hasCompleted,
    validationThreshold,
}: ResolveLearnerContentStatusInput): LearnerContentStatus {
    if (!hasCompleted) return LEARNER_CONTENT_STATUS.todo;
    if (bestScore === null) return LEARNER_CONTENT_STATUS.completed;

    return bestScore >= validationThreshold
        ? LEARNER_CONTENT_STATUS.validated
        : LEARNER_CONTENT_STATUS.retry;
}

export function matchesLearnerContentStatusFilter(
    status: LearnerContentStatus,
    filter: LearnerContentStatusFilter,
) {
    if (filter === LEARNER_CONTENT_STATUS_FILTER.all) return true;

    if (filter === LEARNER_CONTENT_STATUS_FILTER.completed) {
        return status !== LEARNER_CONTENT_STATUS.todo;
    }

    return status === filter;
}

export function buildLearnerContentProgressById(
    definitions: LearnerContentProgressDefinition[],
    completedAttempts: CompletedLearnerContentAttempt[],
) {
    const attemptsByContentId = new Map<
        string,
        { bestScore: number | null; completedCount: number }
    >();

    for (const attempt of completedAttempts) {
        const current = attemptsByContentId.get(attempt.contentId) ?? {
            bestScore: null,
            completedCount: 0,
        };
        current.completedCount += 1;
        if (
            attempt.score !== null
            && Number.isFinite(attempt.score)
            && (current.bestScore === null || attempt.score > current.bestScore)
        ) {
            current.bestScore = attempt.score;
        }
        attemptsByContentId.set(attempt.contentId, current);
    }

    return new Map<string, LearnerContentProgress>(
        definitions.map((definition) => {
            const attempts = attemptsByContentId.get(definition.id) ?? {
                bestScore: null,
                completedCount: 0,
            };

            return [
                definition.id,
                {
                    ...attempts,
                    status: resolveLearnerContentStatus({
                        bestScore: attempts.bestScore,
                        hasCompleted: attempts.completedCount > 0,
                        validationThreshold: definition.validationThreshold,
                    }),
                },
            ];
        }),
    );
}
