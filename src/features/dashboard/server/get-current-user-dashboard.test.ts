import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
    listExplicitQuizAssignments: vi.fn(),
    listExplicitScenarioAssignments: vi.fn(),
    listRoleplayDerivedQuizAssignments: vi.fn(),
    requirePlatformUser: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requirePlatformUser: mocks.requirePlatformUser,
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/features/users/server/user-content-assignments.persistence", () => ({
    listExplicitQuizAssignments: mocks.listExplicitQuizAssignments,
    listExplicitScenarioAssignments: mocks.listExplicitScenarioAssignments,
    listRoleplayDerivedQuizAssignments: mocks.listRoleplayDerivedQuizAssignments,
}));

import { getCurrentUserDashboard } from "./get-current-user-dashboard";

interface RecordedFilter {
    column: string;
    table: string;
    value: unknown;
}

function queryResult(table: string) {
    if (table === "sessions") {
        return {
            data: [{
                created_at: "2026-07-19T10:00:00.000Z",
                duration_seconds: 120,
                id: "session-1",
                notation_json: null,
                scenario_id: "scenario-1",
            }],
            error: null,
        };
    }
    if (table === "roleplay_session_results") {
        return { data: [{ score_percent: 82, session_id: "session-1" }], error: null };
    }
    if (table === "quizzes") {
        return {
            data: [{
                categories: ["Vente", "Prospection"],
                domain: "Commercial",
                duration_minutes: 10,
                id: "quiz-1",
                max_attempts: 3,
                title: "Quiz 1",
                validation_threshold: 70,
            }],
            error: null,
        };
    }
    if (table === "quiz_steps") {
        return { data: [{ id: "step-1", quiz_id: "quiz-1" }], error: null };
    }
    if (table === "quiz_questions") {
        return { data: [{ step_id: "step-1" }, { step_id: "step-1" }], error: null };
    }
    return { data: [], error: null };
}

function createQuery(table: string, filters: RecordedFilter[]) {
    const query = {
        eq(column: string, value: unknown) {
            filters.push({ column, table, value });
            return query;
        },
        gte() { return query; },
        in() { return query; },
        order() { return query; },
        select() { return query; },
        then<TResult1 = unknown, TResult2 = never>(
            onFulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
            onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
            return Promise.resolve(queryResult(table)).then(onFulfilled, onRejected);
        },
        returns() { return query; },
    };
    return query;
}

describe("getCurrentUserDashboard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requirePlatformUser.mockResolvedValue({
            platformRole: "user",
            userId: "current-user",
        });
        mocks.listExplicitQuizAssignments.mockResolvedValue([]);
        mocks.listExplicitScenarioAssignments.mockResolvedValue([]);
        mocks.listRoleplayDerivedQuizAssignments.mockResolvedValue([]);
    });

    it("always scopes personal activity queries to the authenticated user", async () => {
        const filters: RecordedFilter[] = [];
        mocks.createClient.mockResolvedValue({
            auth: {
                getUser: vi.fn().mockResolvedValue({
                    data: { user: { created_at: "2026-01-01T10:00:00.000Z" } },
                    error: null,
                }),
            },
            from: (table: string) => createQuery(table, filters),
        });

        const dashboard = await getCurrentUserDashboard(30);

        expect(mocks.requirePlatformUser).toHaveBeenCalledOnce();
        for (const table of ["sessions", "roleplay_session_results", "quiz_attempts"]) {
            expect(filters).toContainEqual({ column: "user_id", table, value: "current-user" });
        }
        expect(dashboard.periodDays).toBe(30);
        expect(dashboard.quizzes.items.todo[0]).toMatchObject({
            attemptsRemaining: 3,
            questionCount: 2,
        });
    });
});
