import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, LEARNER_CONTENT_STATUS } from "@/features/content/domain";
import { fetchQuizLearnerProgress, fetchQuizList } from "./quiz-query";

function createProgressClient(
    attempts: Array<{
        attempt_number: number;
        quiz_id: string;
        score_percent: number | string | null;
        status: "completed" | "in_progress";
    }>,
) {
    const returns = vi.fn().mockResolvedValue({ data: attempts, error: null });
    const order = vi.fn().mockReturnValue({ returns });
    const eq = vi.fn().mockReturnValue({ order });
    const inFilter = vi.fn().mockReturnValue({ eq });
    const select = vi.fn().mockReturnValue({ in: inFilter });
    const from = vi.fn().mockReturnValue({ select });

    return {
        client: { from } as unknown as SupabaseClient,
        eq,
        from,
        select,
    };
}

function createQuizListClient() {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq, order });
    const from = vi.fn().mockReturnValue({ select });

    return {
        client: { from } as unknown as SupabaseClient,
        eq,
        order,
    };
}

describe("fetchQuizList", () => {
    it("applies the requested publication status in the database query", async () => {
        const { client, eq } = createQuizListClient();

        await fetchQuizList(client, "learner-1", { status: CONTENT_STATUS.published });

        expect(eq).toHaveBeenCalledWith("status", CONTENT_STATUS.published);
    });

    it("does not exclude archived quizzes from an unrestricted admin query", async () => {
        const { client, eq, order } = createQuizListClient();

        await fetchQuizList(client, "admin-1");

        expect(eq).not.toHaveBeenCalled();
        expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
    });
});

describe("fetchQuizLearnerProgress", () => {
    it("derives roleplay quiz progress from completed and in-progress attempts", async () => {
        const { client, eq, from, select } = createProgressClient([
            {
                attempt_number: 2,
                quiz_id: "quiz-retry",
                score_percent: null,
                status: "in_progress",
            },
            {
                attempt_number: 1,
                quiz_id: "quiz-retry",
                score_percent: "65",
                status: "completed",
            },
            {
                attempt_number: 2,
                quiz_id: "quiz-validated",
                score_percent: 90,
                status: "completed",
            },
            {
                attempt_number: 1,
                quiz_id: "quiz-validated",
                score_percent: 72,
                status: "completed",
            },
        ]);

        const progress = await fetchQuizLearnerProgress(
            client,
            [
                { id: "quiz-retry", validationThreshold: 80 },
                { id: "quiz-validated", validationThreshold: 80 },
                { id: "quiz-todo", validationThreshold: 80 },
            ],
            "learner-1",
        );

        expect(progress.get("quiz-retry")).toEqual({
            hasInProgress: true,
            stats: {
                attemptCount: 1,
                bestScore: 65,
                currentScore: 65,
                indexResultCount: 1,
                indexScore: null,
            },
            status: LEARNER_CONTENT_STATUS.retry,
        });
        expect(progress.get("quiz-validated")).toMatchObject({
            hasInProgress: false,
            stats: {
                attemptCount: 2,
                bestScore: 90,
                currentScore: 90,
            },
            status: LEARNER_CONTENT_STATUS.validated,
        });
        expect(progress.get("quiz-todo")).toMatchObject({
            hasInProgress: false,
            stats: {
                attemptCount: 0,
                bestScore: null,
            },
            status: LEARNER_CONTENT_STATUS.todo,
        });
        expect(from).toHaveBeenCalledWith("quiz_attempts");
        expect(select).toHaveBeenCalledWith(
            "quiz_id, attempt_number, score_percent, status",
        );
        expect(eq).toHaveBeenCalledTimes(1);
        expect(eq).toHaveBeenCalledWith("user_id", "learner-1");
    });

    it("does not query attempts without a learner", async () => {
        const { client, from } = createProgressClient([]);

        const progress = await fetchQuizLearnerProgress(
            client,
            [{ id: "quiz-1", validationThreshold: 80 }],
            null,
        );

        expect(progress.size).toBe(0);
        expect(from).not.toHaveBeenCalled();
    });
});
