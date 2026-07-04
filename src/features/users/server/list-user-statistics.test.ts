import { describe, expect, it } from "vitest";
import { buildUserStatistics } from "./list-user-statistics";

describe("buildUserStatistics", () => {
    it("computes engagement and performance from roleplay sessions and quiz attempts", () => {
        const statistics = buildUserStatistics({
            assignedQuizzes: [
                {
                    assignedAt: "1 janvier 2026",
                    attempts: 1,
                    id: "quiz-1",
                    score: 70,
                    status: "completed",
                    title: "Quiz",
                    type: "Quiz de Connaissance",
                },
            ],
            assignedRoleplays: [
                {
                    assignedAt: "1 janvier 2026",
                    id: "roleplay-1",
                    persona: "Persona",
                    score: 80,
                    sessions: 2,
                    status: "completed",
                    title: "Roleplay",
                },
            ],
            criterionRows: [],
            quizAttempts: [
                {
                    completed_at: "2026-01-05T10:00:00.000Z",
                    score_percent: 70,
                    started_at: "2026-01-05T09:55:00.000Z",
                    status: "completed",
                    updated_at: "2026-01-05T10:00:00.000Z",
                },
            ],
            roleplayScorePoints: [
                {
                    completedAt: "2026-01-01T10:00:00.000Z",
                    score: 50,
                    sessionId: "session-1",
                },
                {
                    completedAt: "2026-01-03T10:00:00.000Z",
                    score: 80,
                    sessionId: "session-2",
                },
            ],
            sessions: [
                {
                    created_at: "2026-01-01T10:00:00.000Z",
                    duration_seconds: 600,
                    id: "session-1",
                    notation_json: null,
                },
                {
                    created_at: "2026-01-03T10:00:00.000Z",
                    duration_seconds: 900,
                    id: "session-2",
                    notation_json: null,
                },
            ],
            targetScore: 80,
        });

        expect(statistics.trainingTime).toBe("25min");
        expect(statistics.completedRoleplays).toBe("1/1");
        expect(statistics.completedQuizzes).toBe("1/1");
        expect(statistics.completionRate).toBe("100%");
        expect(statistics.averageRoleplayScore).toBe("65%");
        expect(statistics.averageQuizScore).toBe("70%");
        expect(statistics.bestRoleplayScore).toBe("80%");
        expect(statistics.latestRoleplayScore).toBe("80%");
        expect(statistics.roleplayProgressSinceFirst).toBe("+30 pts");
        expect(statistics.quizVsRoleplayGap).toBe("+5 pts");
    });

    it("builds top skill statistics from weighted criterion results", () => {
        const skillNamesById = new Map([
            ["skill-a", "Argumentation"],
            ["skill-b", "Closing"],
        ]);

        const statistics = buildUserStatistics({
            assignedQuizzes: [],
            assignedRoleplays: [],
            criterionRows: [
                {
                    dimensionItemId: null,
                    pointsAwarded: 8,
                    pointsMax: 10,
                    scorePercent: 80,
                    skillId: "skill-a",
                },
                {
                    dimensionItemId: null,
                    pointsAwarded: 3,
                    pointsMax: 10,
                    scorePercent: 30,
                    skillId: "skill-b",
                },
            ],
            quizAttempts: [],
            roleplayScorePoints: [],
            sessions: [],
            skillNamesById,
        });

        expect(statistics.topMasteredSkills).toEqual([
            { label: "Argumentation", score: 80 },
            { label: "Closing", score: 30 },
        ]);
        expect(statistics.topSkillsToImprove).toEqual([
            { label: "Closing", score: 30 },
            { label: "Argumentation", score: 80 },
        ]);
    });
});
