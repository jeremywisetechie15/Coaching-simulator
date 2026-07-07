import { describe, expect, it } from "vitest";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { syncMethodQuizAssociation } from "./method-quiz-association";

interface FakeQuizRow {
    id: string;
    method_id: string | null;
    quiz_kind: string;
}

function createFakeSupabase(rows: FakeQuizRow[]) {
    const updates: Array<{
        filters: Array<{ column: string; operator: "eq" | "neq"; value: string }>;
        payload: Partial<FakeQuizRow>;
    }> = [];

    return {
        rows,
        updates,
        supabase: {
            from(table: string) {
                if (table !== "quizzes") {
                    throw new Error(`Unexpected table ${table}`);
                }

                return {
                    select() {
                        return {
                            eq(column: string, value: string) {
                                return {
                                    maybeSingle: async () => {
                                        const row = rows.find((item) => item[column as keyof FakeQuizRow] === value) ?? null;
                                        return { data: row, error: null };
                                    },
                                };
                            },
                        };
                    },
                    update(payload: Partial<FakeQuizRow>) {
                        const filters: Array<{ column: string; operator: "eq" | "neq"; value: string }> = [];
                        const apply = async () => {
                            rows.forEach((row) => {
                                const matches = filters.every((filter) => {
                                    const currentValue = row[filter.column as keyof FakeQuizRow];
                                    return filter.operator === "eq"
                                        ? currentValue === filter.value
                                        : currentValue !== filter.value;
                                });

                                if (matches) {
                                    Object.assign(row, payload);
                                }
                            });
                            updates.push({ filters: [...filters], payload });
                            return { error: null };
                        };
                        const builder = {
                            eq(column: string, value: string) {
                                filters.push({ column, operator: "eq", value });
                                return builder;
                            },
                            neq(column: string, value: string) {
                                filters.push({ column, operator: "neq", value });
                                return builder;
                            },
                            then<TResult1 = { error: null }, TResult2 = never>(
                                onfulfilled?: ((value: { error: null }) => TResult1 | PromiseLike<TResult1>) | null,
                                onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                            ) {
                                return apply().then(onfulfilled, onrejected);
                            },
                        };

                        return builder;
                    },
                };
            },
        },
    };
}

describe("syncMethodQuizAssociation", () => {
    it("attaches the selected quiz and detaches other quizzes from the method", async () => {
        const fake = createFakeSupabase([
            { id: "quiz-1", method_id: "method-1", quiz_kind: "method_knowledge" },
            { id: "quiz-2", method_id: null, quiz_kind: "contextual" },
            { id: "quiz-3", method_id: "method-1", quiz_kind: "contextual" },
        ]);

        await syncMethodQuizAssociation(fake.supabase as never, "method-1", "quiz-2");

        expect(fake.rows).toEqual([
            { id: "quiz-1", method_id: null, quiz_kind: "contextual" },
            { id: "quiz-2", method_id: "method-1", quiz_kind: "method_knowledge" },
            { id: "quiz-3", method_id: "method-1", quiz_kind: "contextual" },
        ]);
    });

    it("detaches every quiz when no quiz is selected", async () => {
        const fake = createFakeSupabase([
            { id: "quiz-1", method_id: "method-1", quiz_kind: "method_knowledge" },
            { id: "quiz-2", method_id: "method-2", quiz_kind: "method_knowledge" },
            { id: "quiz-3", method_id: "method-1", quiz_kind: "contextual" },
        ]);

        await syncMethodQuizAssociation(fake.supabase as never, "method-1", null);

        expect(fake.rows).toEqual([
            { id: "quiz-1", method_id: null, quiz_kind: "contextual" },
            { id: "quiz-2", method_id: "method-2", quiz_kind: "method_knowledge" },
            { id: "quiz-3", method_id: "method-1", quiz_kind: "contextual" },
        ]);
    });

    it("rejects a quiz already linked to another method", async () => {
        const fake = createFakeSupabase([{ id: "quiz-1", method_id: "method-2", quiz_kind: "contextual" }]);

        await expect(syncMethodQuizAssociation(fake.supabase as never, "method-1", "quiz-1")).rejects.toThrow(
            AppError,
        );
        expect(fake.rows[0].method_id).toBe("method-2");
    });

    it("rejects an unknown quiz", async () => {
        const fake = createFakeSupabase([]);

        await expect(syncMethodQuizAssociation(fake.supabase as never, "method-1", "quiz-1")).rejects.toThrow(
            NotFoundError,
        );
    });
});
