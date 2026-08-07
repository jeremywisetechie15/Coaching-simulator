import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain/quiz";
import { isQuizAssignableAsMethodKnowledge } from "./method-quiz-selection";

describe("method knowledge quiz selection policy", () => {
    it("allows an unassigned contextual quiz", () => {
        expect(isQuizAssignableAsMethodKnowledge({
            id: "quiz-1",
            kind: QUIZ_KIND.contextual,
            methodId: null,
        }, "method-1")).toBe(true);
    });

    it("allows promoting a contextual quiz already linked to the same method", () => {
        expect(isQuizAssignableAsMethodKnowledge({
            id: "quiz-1",
            kind: QUIZ_KIND.contextual,
            methodId: "method-1",
        }, "method-1")).toBe(true);
    });

    it("rejects quizzes linked to another method or unavailable", () => {
        expect(isQuizAssignableAsMethodKnowledge({
            id: "quiz-1",
            kind: QUIZ_KIND.contextual,
            methodId: "method-2",
        }, "method-1")).toBe(false);
        expect(isQuizAssignableAsMethodKnowledge({
            id: "quiz-2",
            isSelectable: false,
            kind: QUIZ_KIND.contextual,
            methodId: null,
        }, "method-1")).toBe(false);
    });
});
