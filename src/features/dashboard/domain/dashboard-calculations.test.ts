import { describe, expect, it } from "vitest";
import {
    buildDashboardViewData,
    calculateDashboardAverageScore,
    getDashboardPeriodRange,
} from "./dashboard-calculations";

const now = new Date("2026-07-20T12:00:00.000Z");

describe("dashboard calculations", () => {
    it("calculates the dashboard average from the best score of each distinct activity", () => {
        expect(calculateDashboardAverageScore([
            { activityId: "scenario-a", occurredAt: "2026-07-18T10:00:00.000Z", score: 40 },
            { activityId: "scenario-a", occurredAt: "2026-07-19T10:00:00.000Z", score: 80 },
            { activityId: "scenario-b", occurredAt: "2026-07-19T11:00:00.000Z", score: 71 },
        ])).toEqual({ sampleSize: 2, score: 75.5 });
    });

    it("keeps every real score inside each chart bucket", () => {
        const dashboard = buildDashboardViewData({
            now,
            periodDays: 7,
            quizAttempts: [],
            quizzes: [],
            roleplaySessions: [
                { createdAt: "2026-07-19T09:00:00.000Z", durationSeconds: 90, id: "session-a1", scenarioId: "scenario-a", scorePercent: 20 },
                { createdAt: "2026-07-19T10:00:00.000Z", durationSeconds: 90, id: "session-a2", scenarioId: "scenario-a", scorePercent: 80 },
                { createdAt: "2026-07-19T11:00:00.000Z", durationSeconds: 90, id: "session-b1", scenarioId: "scenario-b", scorePercent: 60 },
            ],
            scenarios: [],
        });

        const roleplayPoint = dashboard.performance.series[0]?.values.find((value) => value !== null);
        expect(roleplayPoint).toBeCloseTo(160 / 3);
    });

    it("keeps volume, mastery and current assignment states separate", () => {
        const dashboard = buildDashboardViewData({
            now,
            periodDays: 30,
            scenarios: [
                { assignedAt: "2026-06-01T10:00:00.000Z", category: "Vente", domain: "Commercial", id: "scenario-a", personaAvatarUrl: null, personaName: "A", title: "Scénario A" },
                { assignedAt: "2026-06-02T10:00:00.000Z", category: "Vente", domain: "Commercial", id: "scenario-b", personaAvatarUrl: null, personaName: "B", title: "Scénario B" },
                { assignedAt: "2026-07-18T10:00:00.000Z", category: "Feedback", domain: "Management", id: "scenario-c", personaAvatarUrl: null, personaName: "C", title: "Scénario C" },
            ],
            roleplaySessions: [
                { createdAt: "2026-07-15T10:00:00.000Z", durationSeconds: 180, id: "session-a1", scenarioId: "scenario-a", scorePercent: 50 },
                { createdAt: "2026-07-16T10:00:00.000Z", durationSeconds: 240, id: "session-a2", scenarioId: "scenario-a", scorePercent: 85 },
                { createdAt: "2026-07-17T10:00:00.000Z", durationSeconds: 300, id: "session-b1", scenarioId: "scenario-b", scorePercent: 60 },
            ],
            quizzes: [
                { assignedAt: "2026-06-01T10:00:00.000Z", categories: ["Vente", "Prospection"], domain: "Commercial", durationMinutes: 10, id: "quiz-a", maxAttempts: 3, questionCount: 5, title: "Quiz A", validationThreshold: 70 },
                { assignedAt: "2026-06-01T10:00:00.000Z", categories: ["Vente"], domain: "Commercial", durationMinutes: 10, id: "quiz-b", maxAttempts: null, questionCount: 7, title: "Quiz B", validationThreshold: 70 },
                { assignedAt: "2026-07-18T10:00:00.000Z", categories: ["Feedback"], domain: "Management", durationMinutes: 10, id: "quiz-c", maxAttempts: 3, questionCount: 9, title: "Quiz C", validationThreshold: 70 },
            ],
            quizAttempts: [
                { attemptNumber: 1, completedAt: "2026-07-14T10:00:00.000Z", id: "attempt-a1", quizId: "quiz-a", scorePercent: 44, startedAt: "2026-07-14T09:00:00.000Z", status: "completed" },
                { attemptNumber: 2, completedAt: "2026-07-15T10:00:00.000Z", id: "attempt-a2", quizId: "quiz-a", scorePercent: 68, startedAt: "2026-07-15T09:00:00.000Z", status: "completed" },
                { attemptNumber: 1, completedAt: "2026-07-16T10:00:00.000Z", id: "attempt-b1", quizId: "quiz-b", scorePercent: 80, startedAt: "2026-07-16T09:00:00.000Z", status: "completed" },
                { attemptNumber: 1, completedAt: null, id: "attempt-c1", quizId: "quiz-c", scorePercent: null, startedAt: "2026-07-18T09:00:00.000Z", status: "in_progress" },
            ],
        });

        expect(dashboard.roleplays.counts).toEqual({ completed: 3, retry: 1, todo: 1 });
        expect(dashboard.quizzes.counts).toEqual({ completed: 2, retry: 1, todo: 1 });
        expect(dashboard.performance.scoreSummaries).toMatchObject([
            { label: "Score moyen roleplay", sampleSize: 2, value: 72.5 },
            { label: "Score moyen quiz", sampleSize: 2, value: 74 },
        ]);
        expect(dashboard.activity.roleplays.find((metric) => metric.id === "validated-scenarios")?.value).toBe("1/2");
        expect(dashboard.activity.quizzes.find((metric) => metric.id === "validated-quizzes")?.value).toBe("1/2");
        expect(dashboard.quizzes.items.todo[0]).toMatchObject({
            actionLabel: "Reprendre",
            attemptsRemaining: 3,
            questionCount: 9,
        });
        expect(dashboard.quizzes.items.retry[0]).toMatchObject({
            attemptsRemaining: 1,
            questionCount: 5,
        });
        expect(dashboard.quizzes.items.completed.find((item) => item.id === "quiz-b")).toMatchObject({
            attemptsRemaining: null,
            questionCount: 7,
        });
        expect(dashboard.domainPerformance.roleplays[0]?.score).toBe(72.5);
    });

    it("uses adjacent periods with the same duration", () => {
        const range = getDashboardPeriodRange(7, now);
        expect(range.currentStart.toISOString()).toBe("2026-07-13T22:00:00.000Z");
        expect(range.currentEndExclusive.toISOString()).toBe("2026-07-20T22:00:00.000Z");
        expect(range.currentStart.getTime() - range.previousStart.getTime()).toBe(7 * 86_400_000);
    });

    it("shows unavailable scores instead of zero when there is no result", () => {
        const dashboard = buildDashboardViewData({
            now,
            periodDays: 30,
            quizAttempts: [],
            quizzes: [],
            roleplaySessions: [],
            scenarios: [],
        });

        expect(dashboard.performance.scoreSummaries.every((summary) => summary.value === null)).toBe(true);
        expect(dashboard.activity.roleplays.find((metric) => metric.id === "validated-scenarios")?.value).toBe("-");
        expect(dashboard.activity.quizzes.find((metric) => metric.id === "validated-quizzes")?.value).toBe("-");
    });
});
