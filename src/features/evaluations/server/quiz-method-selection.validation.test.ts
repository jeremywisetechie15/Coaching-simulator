import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { ConflictError } from "@/lib/server/errors";
import { assertQuizMethodSelection } from "./quiz-method-selection.validation";

function createFakeSupabase({
    canonicalQuizId = null,
    methodActive = true,
    methodStatus = "published",
}: {
    canonicalQuizId?: string | null;
    methodActive?: boolean;
    methodStatus?: string;
} = {}) {
    return {
        from(table: string) {
            const builder = {
                eq() {
                    return builder;
                },
                neq() {
                    return builder;
                },
                maybeSingle: async () => ({
                    data: table === "methods"
                        ? { id: "method-1", is_active: methodActive, status: methodStatus }
                        : canonicalQuizId
                            ? { id: canonicalQuizId }
                            : null,
                    error: null,
                }),
                select() {
                    return builder;
                },
            };

            return builder;
        },
    };
}

describe("quiz method selection server validation", () => {
    it("allows a contextual quiz even when the method already has its principal quiz", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ canonicalQuizId: "quiz-principal" }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.contextual },
        )).resolves.toBeUndefined();
    });

    it("rejects a second principal quiz for the same method", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ canonicalQuizId: "quiz-principal" }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.methodKnowledge },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("allows the current principal quiz while editing", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ canonicalQuizId: "quiz-principal" }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.methodKnowledge },
            "quiz-principal",
        )).resolves.toBeUndefined();
    });

    it("rejects an unavailable method", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ methodActive: false }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.contextual },
        )).rejects.toBeInstanceOf(ConflictError);
    });
});
