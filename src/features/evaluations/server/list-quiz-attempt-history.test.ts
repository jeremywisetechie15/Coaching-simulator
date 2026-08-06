import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import { listQuizAttemptHistory } from "./list-quiz-attempt-history";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAuth: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({
    requireAuth: mocks.requireAuth,
}));

vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: mocks.createAdminClient,
}));

function createQuery(data: unknown[]) {
    const query = {
        eq: vi.fn(),
        in: vi.fn(),
        order: vi.fn(),
        returns: vi.fn().mockResolvedValue({ data, error: null }),
        select: vi.fn(),
    };

    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.select.mockReturnValue(query);

    return query;
}

describe("listQuizAttemptHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAuth.mockResolvedValue({ userId: "learner-1" });
    });

    it("keeps a completed attempt visible when its quiz is archived", async () => {
        const attemptQuery = createQuery([
            {
                active_duration_seconds: 95,
                attempt_number: 1,
                completed_at: "2026-07-30T10:00:00.000Z",
                id: "attempt-1",
                passed: true,
                quiz_id: "quiz-archived",
                score_percent: 82,
            },
        ]);
        const quizQuery = createQuery([
            {
                categories: ["Vente"],
                difficulty_level: "Moyen",
                domain: "Commerce et développement commercial",
                id: "quiz-archived",
                is_active: false,
                quiz_type: "knowledge",
                status: CONTENT_STATUS.archived,
                title: "Quiz historique",
                validation_threshold: 80,
            },
        ]);
        const from = vi.fn((table: string) =>
            table === "quiz_attempts" ? attemptQuery : quizQuery,
        );
        mocks.createAdminClient.mockReturnValue({ from });

        const result = await listQuizAttemptHistory({});

        expect(from).toHaveBeenNthCalledWith(1, "quiz_attempts");
        expect(from).toHaveBeenNthCalledWith(2, "quizzes");
        expect(attemptQuery.eq).toHaveBeenCalledWith("user_id", "learner-1");
        expect(result).toEqual([
            expect.objectContaining({
                attempt: expect.objectContaining({ id: "attempt-1", score: 82 }),
                quiz: expect.objectContaining({
                    id: "quiz-archived",
                    status: CONTENT_STATUS.archived,
                    title: "Quiz historique",
                }),
            }),
        ]);
    });
});
