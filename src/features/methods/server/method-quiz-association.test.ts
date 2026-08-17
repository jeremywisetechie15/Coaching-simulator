import { describe, expect, it } from "vitest";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { syncMethodQuizAssociation } from "./method-quiz-association";

interface FakeQuizRow {
    id: string;
    method_id: string | null;
    quiz_kind: string;
}

function createFakeSupabase(rows: FakeQuizRow[]) {
    return {
        rows,
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
                                        return {
                                            data: row
                                                ? { ...row, is_active: true, status: "published" }
                                                : null,
                                            error: null,
                                        };
                                    },
                                };
                            },
                        };
                    },
                };
            },
            async rpc(
                functionName: string,
                args: { p_method_id: string; p_quiz_id: string | null },
            ) {
                if (functionName !== "admin_sync_method_quiz_association") {
                    throw new Error(`Unexpected function ${functionName}`);
                }

                rows.forEach((row) => {
                    if (
                        row.method_id === args.p_method_id
                        && row.quiz_kind === "method_knowledge"
                        && row.id !== args.p_quiz_id
                    ) {
                        row.method_id = null;
                        row.quiz_kind = "contextual";
                    }
                });

                const selectedQuiz = rows.find((row) => row.id === args.p_quiz_id);
                if (selectedQuiz) {
                    selectedQuiz.method_id = args.p_method_id;
                    selectedQuiz.quiz_kind = "method_knowledge";
                }

                return { error: null };
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
