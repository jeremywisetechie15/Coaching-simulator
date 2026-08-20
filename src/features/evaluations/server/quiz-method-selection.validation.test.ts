import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import type { SaveQuizDto } from "@/features/evaluations/dto";
import { ConflictError } from "@/lib/server/errors";
import { assertQuizMethodSelection } from "./quiz-method-selection.validation";

function createFakeSupabase({
    canonicalQuizId = null,
    methodActive = true,
    methodStepIds = [],
    methodStatus = "published",
}: {
    canonicalQuizId?: string | null;
    methodActive?: boolean;
    methodStepIds?: string[];
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
                in() {
                    return builder;
                },
                returns: async () => ({
                    data: table === "method_steps"
                        ? methodStepIds.map((id) => ({ id }))
                        : [],
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
    it("rejects a reference method on a contextual quiz", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: "method-1",
                quizKind: QUIZ_KIND.contextual,
                status: "draft",
                steps: [],
            },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("allows a contextual quiz without a reference method", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: null,
                quizKind: QUIZ_KIND.contextual,
                status: "draft",
                steps: [],
            },
        )).resolves.toBeUndefined();
    });

    it("allows a method quiz draft without a method but rejects its publication", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: null,
                quizKind: QUIZ_KIND.methodKnowledge,
                status: "draft",
                steps: [],
            },
        )).resolves.toBeUndefined();

        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: null,
                quizKind: QUIZ_KIND.methodKnowledge,
                status: "published",
                steps: [],
            },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects a second principal quiz for the same method", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ canonicalQuizId: "quiz-principal" }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.methodKnowledge, status: "published", steps: [] },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("allows the current principal quiz while editing", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ canonicalQuizId: "quiz-principal" }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.methodKnowledge, status: "published", steps: [] },
            "quiz-principal",
        )).resolves.toBeUndefined();
    });

    it("rejects an unavailable method", async () => {
        await expect(assertQuizMethodSelection(
            createFakeSupabase({ methodActive: false }) as never,
            { methodId: "method-1", quizKind: QUIZ_KIND.methodKnowledge, status: "published", steps: [] },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("allows only the exact draft method created by internal duplication", async () => {
        const supabase = createFakeSupabase({ methodStatus: "draft" }) as never;
        const input: Pick<SaveQuizDto, "methodId" | "quizKind" | "status" | "steps"> = {
            methodId: "method-1",
            quizKind: QUIZ_KIND.methodKnowledge,
            status: "draft",
            steps: [],
        };

        await expect(assertQuizMethodSelection(supabase, input)).rejects.toBeInstanceOf(
            ConflictError,
        );
        await expect(assertQuizMethodSelection(supabase, input, null, {
            allowedDraftMethodId: "method-1",
        })).resolves.toBeUndefined();
    });

    it("accepts only optional step links belonging to the selected method", async () => {
        const methodStepId = "step-1";

        await expect(assertQuizMethodSelection(
            createFakeSupabase({ methodStepIds: [methodStepId] }) as never,
            {
                methodId: "method-1",
                quizKind: QUIZ_KIND.methodKnowledge,
                status: "published",
                steps: [{ methodStepId }] as never,
            },
        )).resolves.toBeUndefined();

        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: "method-1",
                quizKind: QUIZ_KIND.methodKnowledge,
                status: "published",
                steps: [{ methodStepId }] as never,
            },
        )).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects method-step links on contextual quizzes", async () => {
        const methodStepId = "step-1";

        await expect(assertQuizMethodSelection(
            createFakeSupabase({ methodStepIds: [methodStepId] }) as never,
            {
                methodId: "method-1",
                quizKind: QUIZ_KIND.contextual,
                status: "draft",
                steps: [{ methodStepId }] as never,
            },
        )).rejects.toBeInstanceOf(ConflictError);

        await expect(assertQuizMethodSelection(
            createFakeSupabase() as never,
            {
                methodId: null,
                quizKind: QUIZ_KIND.contextual,
                status: "draft",
                steps: [{ methodStepId }] as never,
            },
        )).rejects.toBeInstanceOf(ConflictError);
    });
});
