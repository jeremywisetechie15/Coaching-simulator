import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "./quiz";
import { isQuizMethodSelectableForKind } from "./quiz-method-selection";

const method = {
    id: "method-1",
    isSelectable: true,
    methodKnowledgeQuizId: null,
};

describe("quiz method selection policy", () => {
    it("allows every selectable method for a contextual quiz", () => {
        expect(isQuizMethodSelectableForKind({
            ...method,
            methodKnowledgeQuizId: "other-quiz",
        }, QUIZ_KIND.contextual)).toBe(true);
    });

    it("allows a method knowledge quiz only when the canonical slot is free", () => {
        expect(isQuizMethodSelectableForKind(method, QUIZ_KIND.methodKnowledge)).toBe(true);
        expect(isQuizMethodSelectableForKind({
            ...method,
            methodKnowledgeQuizId: "other-quiz",
        }, QUIZ_KIND.methodKnowledge)).toBe(false);
    });

    it("keeps the current canonical method selectable while editing", () => {
        expect(isQuizMethodSelectableForKind({
            ...method,
            methodKnowledgeQuizId: "quiz-1",
        }, QUIZ_KIND.methodKnowledge, "quiz-1")).toBe(true);
    });

    it("rejects unavailable methods for every kind", () => {
        expect(isQuizMethodSelectableForKind({
            ...method,
            isSelectable: false,
        }, QUIZ_KIND.contextual)).toBe(false);
    });
});
