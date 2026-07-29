import { describe, expect, it } from "vitest";
import {
    DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS,
    countActiveQuizAttemptHistoryFilters,
    filterQuizAttemptHistory,
    listQuizAttemptHistoryQuizzes,
} from "./quiz-attempt-history";

const attempts = [
    {
        occurredAt: "2026-07-29T10:00:00.000Z",
        quiz: {
            categories: ["Prospection"],
            difficulty: "Moyen",
            domain: "Commercial",
            id: "quiz-b",
            title: "Prise de rendez-vous",
            typeLabel: "Quiz de Connaissance",
        },
    },
    {
        occurredAt: "2026-06-01T08:00:00.000Z",
        quiz: {
            categories: ["Feedback"],
            difficulty: "Difficile",
            domain: "Management",
            id: "quiz-a",
            title: "Donner un feedback",
            typeLabel: "Quiz d'Auto-Positionnement",
        },
    },
];

describe("quiz attempt history filters", () => {
    it("combines quiz, taxonomy, type and level filters", () => {
        expect(
            filterQuizAttemptHistory(attempts, {
                category: "Prospection",
                dateFrom: "",
                dateTo: "",
                domain: "Commercial",
                level: "Moyen",
                quizId: "quiz-b",
                type: "Quiz de Connaissance",
            }),
        ).toEqual([attempts[0]]);
    });

    it("includes both boundaries of the selected date range", () => {
        expect(
            filterQuizAttemptHistory(attempts, {
                ...DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS,
                dateFrom: "2026-07-29",
                dateTo: "2026-07-29",
            }),
        ).toEqual([attempts[0]]);
    });

    it("lists each quiz once and sorts labels", () => {
        expect(listQuizAttemptHistoryQuizzes([...attempts, attempts[0]])).toEqual([
            { label: "Donner un feedback", value: "quiz-a" },
            { label: "Prise de rendez-vous", value: "quiz-b" },
        ]);
    });

    it("counts only non-default filters", () => {
        expect(
            countActiveQuizAttemptHistoryFilters({
                ...DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS,
                dateFrom: "2026-07-01",
                dateTo: "2026-07-31",
                domain: "Commercial",
                type: "Quiz de Connaissance",
            }),
        ).toBe(3);
    });
});
