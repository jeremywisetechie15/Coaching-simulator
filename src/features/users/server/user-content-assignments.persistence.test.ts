import { describe, expect, it } from "vitest";
import {
    filterAssignableContentRows,
    resolveRoleplayDerivedQuizAssignments,
} from "./user-content-assignments.persistence";

const userId = "11111111-1111-4111-8111-111111111111";

describe("user content assignments", () => {
    it("excludes existing explicit and legacy direct assignments without hiding other published content", () => {
        const rows = [
            {
                assigned_user_id: null,
                description: "Public",
                id: "22222222-2222-4222-8222-222222222222",
                title: "Public roleplay",
                visibility_scope: "public",
            },
            {
                assigned_user_id: userId,
                description: null,
                id: "33333333-3333-4333-8333-333333333333",
                title: "Legacy direct",
                visibility_scope: "user",
            },
            {
                assigned_user_id: null,
                description: "Already assigned",
                id: "44444444-4444-4444-8444-444444444444",
                title: "Explicit",
                visibility_scope: "organization",
            },
        ];

        expect(filterAssignableContentRows(
            rows,
            ["44444444-4444-4444-8444-444444444444"],
            userId,
        )).toEqual([
            {
                description: "Public",
                id: "22222222-2222-4222-8222-222222222222",
                title: "Public roleplay",
            },
        ]);
    });

    it("includes explicit and implicit method quizzes once and ignores inactive scenarios", () => {
        expect(resolveRoleplayDerivedQuizAssignments({
            methodQuizRows: [
                { id: "quiz-method", method_id: "method-1" },
            ],
            scenarioAssignments: [
                { assigned_at: "2026-07-01T10:00:00.000Z", scenario_id: "scenario-active" },
                { assigned_at: "2026-07-02T10:00:00.000Z", scenario_id: "scenario-archived" },
            ],
            scenarioQuizRows: [
                { quiz_id: "quiz-explicit", scenario_id: "scenario-active" },
                { quiz_id: "quiz-method", scenario_id: "scenario-active" },
                { quiz_id: "quiz-archived", scenario_id: "scenario-archived" },
            ],
            scenarioRows: [
                { id: "scenario-active", method_id: "method-1" },
            ],
        })).toEqual([
            {
                assigned_at: "2026-07-01T10:00:00.000Z",
                content_id: "quiz-explicit",
            },
            {
                assigned_at: "2026-07-01T10:00:00.000Z",
                content_id: "quiz-method",
            },
        ]);
    });
});
