import { describe, expect, it } from "vitest";
import { NotFoundError } from "@/lib/server/errors";
import { getAccessibleQuizForAttempt, type QuizAttemptQuizRow } from "./quiz-attempt-access";

function createFakeSupabase(row: QuizAttemptQuizRow | null) {
    return {
        from(table: string) {
            if (table !== "quizzes") throw new Error(`Unexpected table ${table}`);

            return {
                select() {
                    const builder = {
                        eq(column: string, value: string) {
                            if (column !== "id") throw new Error(`Unexpected column ${column}`);
                            return value === row?.id ? builder : createMissingBuilder();
                        },
                        maybeSingle: async () => ({ data: row, error: null }),
                    };

                    return builder;
                },
            };
        },
    };
}

function createMissingBuilder() {
    return {
        maybeSingle: async () => ({ data: null, error: null }),
    };
}

describe("quiz attempt access", () => {
    it("returns a visible active quiz", async () => {
        const quiz = { id: "quiz-1", is_active: true, max_attempts: 2, status: "published" };

        await expect(getAccessibleQuizForAttempt(createFakeSupabase(quiz) as never, quiz.id)).resolves.toEqual(quiz);
    });

    it("hides quizzes filtered out by RLS", async () => {
        await expect(getAccessibleQuizForAttempt(createFakeSupabase(null) as never, "private-quiz"))
            .rejects.toThrow(NotFoundError);
    });

    it("rejects archived or inactive quizzes", async () => {
        await expect(getAccessibleQuizForAttempt(createFakeSupabase({
            id: "quiz-1",
            is_active: false,
            status: "published",
        }) as never, "quiz-1")).rejects.toThrow(NotFoundError);
    });
});
