export const QUIZ_ATTEMPT_HISTORY_ALL_VALUE = "all";

export interface QuizAttemptHistoryFilters {
    category: string;
    dateFrom: string;
    dateTo: string;
    domain: string;
    level: string;
    quizId: string;
    type: string;
}

export const DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS: QuizAttemptHistoryFilters = {
    category: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
    dateFrom: "",
    dateTo: "",
    domain: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
    level: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
    quizId: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
    type: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
};

interface QuizAttemptHistoryFilterCandidate {
    occurredAt: string;
    quiz: {
        categories: string[];
        difficulty: string | null;
        domain: string;
        id: string;
        title: string;
        typeLabel: string;
    };
}

export function isQuizAttemptHistoryDate(
    value: string | null | undefined,
): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

export function filterQuizAttemptHistory<T extends QuizAttemptHistoryFilterCandidate>(
    attempts: readonly T[],
    filters: QuizAttemptHistoryFilters,
) {
    const dateFrom = isQuizAttemptHistoryDate(filters.dateFrom)
        ? new Date(`${filters.dateFrom}T00:00:00`)
        : null;
    const dateTo = isQuizAttemptHistoryDate(filters.dateTo)
        ? new Date(`${filters.dateTo}T23:59:59.999`)
        : null;

    return attempts.filter((item) => {
        const matchesQuiz =
            filters.quizId === QUIZ_ATTEMPT_HISTORY_ALL_VALUE ||
            item.quiz.id === filters.quizId;
        const matchesDomain =
            filters.domain === QUIZ_ATTEMPT_HISTORY_ALL_VALUE ||
            item.quiz.domain === filters.domain;
        const matchesCategory =
            filters.category === QUIZ_ATTEMPT_HISTORY_ALL_VALUE ||
            item.quiz.categories.includes(filters.category);
        const matchesType =
            filters.type === QUIZ_ATTEMPT_HISTORY_ALL_VALUE ||
            item.quiz.typeLabel === filters.type;
        const matchesLevel =
            filters.level === QUIZ_ATTEMPT_HISTORY_ALL_VALUE ||
            item.quiz.difficulty === filters.level;
        const occurredAtTimestamp = new Date(item.occurredAt).getTime();
        const matchesDateFrom =
            !dateFrom ||
            (!Number.isNaN(occurredAtTimestamp) && occurredAtTimestamp >= dateFrom.getTime());
        const matchesDateTo =
            !dateTo ||
            (!Number.isNaN(occurredAtTimestamp) && occurredAtTimestamp <= dateTo.getTime());

        return matchesQuiz
            && matchesDomain
            && matchesCategory
            && matchesType
            && matchesLevel
            && matchesDateFrom
            && matchesDateTo;
    });
}

export function countActiveQuizAttemptHistoryFilters(filters: QuizAttemptHistoryFilters) {
    const selectFilterCount = [
        filters.category,
        filters.domain,
        filters.level,
        filters.quizId,
        filters.type,
    ].filter((value) => value !== QUIZ_ATTEMPT_HISTORY_ALL_VALUE).length;

    return selectFilterCount + Number(Boolean(filters.dateFrom || filters.dateTo));
}

export function listQuizAttemptHistoryQuizzes<T extends QuizAttemptHistoryFilterCandidate>(
    attempts: readonly T[],
) {
    return Array.from(
        new Map(
            attempts.map((item) => [
                item.quiz.id,
                {
                    label: item.quiz.title,
                    value: item.quiz.id,
                },
            ]),
        ).values(),
    ).sort((left, right) => left.label.localeCompare(right.label, "fr"));
}
