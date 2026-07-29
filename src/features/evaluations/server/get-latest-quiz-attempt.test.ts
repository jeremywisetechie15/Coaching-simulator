import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotFoundError } from "@/lib/server/errors";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    createClient: vi.fn(),
    fetchQuizAttemptDetail: vi.fn(),
    getAccessibleQuizForAttempt: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAuth: mocks.requireAuth,
}));
vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));
vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));
vi.mock("./quiz-attempt-access", () => ({
    getAccessibleQuizForAttempt: mocks.getAccessibleQuizForAttempt,
}));
vi.mock("./quiz-attempt-query", () => ({
    fetchQuizAttemptDetail: mocks.fetchQuizAttemptDetail,
    QUIZ_ATTEMPT_SELECT:
        "id, quiz_id, user_id, status, attempt_number, started_at, completed_at, score_percent, earned_points, max_points, passed",
}));

import { getQuizAttempt } from "./get-latest-quiz-attempt";

type AttemptRow = Record<string, unknown>;

class FakeAttemptQuery implements PromiseLike<{
    count: number | null;
    data: null;
    error: null;
}> {
    private readonly filters: Array<(row: AttemptRow) => boolean> = [];

    constructor(private readonly rows: AttemptRow[]) {}

    select() {
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    order() {
        return this;
    }

    limit() {
        return this;
    }

    async maybeSingle() {
        return {
            data: this.rows.find((row) => this.filters.every((filter) => filter(row))) ?? null,
            error: null,
        };
    }

    then<TResult1 = {
        count: number | null;
        data: null;
        error: null;
    }, TResult2 = never>(
        onfulfilled?: ((value: {
            count: number | null;
            data: null;
            error: null;
        }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        const count = this.rows.filter((row) =>
            this.filters.every((filter) => filter(row))
        ).length;

        return Promise.resolve({ count, data: null, error: null } as const)
            .then(onfulfilled, onrejected);
    }
}

const ownAttempt = {
    attempt_number: 1,
    completed_at: "2026-07-29T10:00:00.000Z",
    earned_points: 8,
    id: "attempt-own",
    max_points: 10,
    passed: true,
    quiz_id: "quiz-1",
    score_percent: 80,
    started_at: "2026-07-29T09:55:00.000Z",
    status: "completed",
    user_id: "user-1",
};

describe("getQuizAttempt", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
        mocks.createClient.mockResolvedValue({ from: vi.fn() });
        mocks.getAccessibleQuizForAttempt.mockResolvedValue({
            id: "quiz-1",
            max_attempts: 3,
        });
        mocks.createAdminClient.mockReturnValue({
            from: () => new FakeAttemptQuery([
                ownAttempt,
                {
                    ...ownAttempt,
                    id: "attempt-other",
                    user_id: "user-2",
                },
            ]),
        });
        mocks.fetchQuizAttemptDetail.mockImplementation(async (_client, row) => ({
            answers: [],
            attemptNumber: row.attempt_number,
            completedAt: row.completed_at,
            earnedPoints: row.earned_points,
            id: row.id,
            maxPoints: row.max_points,
            passed: row.passed,
            quizId: row.quiz_id,
            scorePercent: row.score_percent,
            startedAt: row.started_at,
            status: row.status,
            stepScores: [],
            userId: row.user_id,
        }));
    });

    it("loads the requested completed attempt owned by the current user", async () => {
        const session = await getQuizAttempt("quiz-1", "attempt-own");

        expect(session.attempt?.id).toBe("attempt-own");
        expect(session.attemptsUsed).toBe(1);
        expect(session.attemptsRemaining).toBe(2);
    });

    it("does not expose another user's attempt", async () => {
        await expect(getQuizAttempt("quiz-1", "attempt-other"))
            .rejects.toThrow(NotFoundError);
        expect(mocks.fetchQuizAttemptDetail).not.toHaveBeenCalled();
    });
});
