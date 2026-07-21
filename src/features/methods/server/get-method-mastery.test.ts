import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { getMethodMastery } from "./get-method-mastery";

interface QueryResult {
    data: unknown[];
    error: null;
}

function createQuery(table: string, result: QueryResult, filters: Array<[string, unknown]>) {
    const query = {
        eq(column: string, value: unknown) {
            filters.push([`${table}.${column}`, value]);
            return query;
        },
        in() { return query; },
        limit() { return query; },
        not() { return query; },
        order() { return query; },
        range() { return query; },
        returns() { return query; },
        select() { return query; },
        then<TResult1 = unknown, TResult2 = never>(
            onFulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
            onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) {
            return Promise.resolve(result).then(onFulfilled, onRejected);
        },
    };

    return query;
}

describe("getMethodMastery", () => {
    const filters: Array<[string, unknown]> = [];

    beforeEach(() => {
        vi.clearAllMocks();
        filters.length = 0;
    });

    it("returns the authenticated learner's latest completed score", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "user", userId: "learner-1" });
        mocks.createAdminClient.mockReturnValue({
            from: (table: string) => createQuery(table, {
                data: [
                    { completed_at: "2026-07-20T10:00:00.000Z", score_percent: 82, user_id: "learner-1" },
                    { completed_at: "2026-07-19T10:00:00.000Z", score_percent: 70, user_id: "learner-1" },
                ],
                error: null,
            }, filters),
        });

        await expect(getMethodMastery("quiz-1")).resolves.toMatchObject({
            delta: 12,
            participantCount: 1,
            scorePercent: 82,
            scope: "personal",
        });
        expect(filters).toContainEqual(["quiz_attempts.user_id", "learner-1"]);
    });

    it("returns the average of each learner's latest score to an administrator", async () => {
        mocks.requireAuth.mockResolvedValue({ platformRole: "admin", userId: "admin-1" });
        mocks.createAdminClient.mockReturnValue({
            from: (table: string) => createQuery(
                table,
                table === "profiles"
                    ? {
                          data: [
                              { id: "learner-1", platform_role: "user" },
                              { id: "learner-2", platform_role: "user" },
                              { id: "admin-1", platform_role: "admin" },
                          ],
                          error: null,
                      }
                    : {
                          data: [
                              { completed_at: "2026-07-20T10:00:00.000Z", score_percent: 80, user_id: "learner-1" },
                              { completed_at: "2026-07-19T10:00:00.000Z", score_percent: 20, user_id: "learner-1" },
                              { completed_at: "2026-07-18T10:00:00.000Z", score_percent: 60, user_id: "learner-2" },
                              { completed_at: "2026-07-17T10:00:00.000Z", score_percent: 100, user_id: "admin-1" },
                          ],
                          error: null,
                      },
                filters,
            ),
        });

        await expect(getMethodMastery("quiz-1")).resolves.toMatchObject({
            participantCount: 2,
            scorePercent: 70,
            scope: "participant_average",
        });
        expect(filters).not.toContainEqual(["quiz_attempts.user_id", "admin-1"]);
    });
});
