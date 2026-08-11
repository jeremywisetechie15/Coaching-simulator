import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "./quiz";
import {
    getQuizMethodAssociationError,
    isQuizMethodSelectableForKind,
    normalizeQuizMethodId,
} from "./quiz-method-selection";

const method = {
    id: "method-1",
    isSelectable: true,
    methodKnowledgeQuizId: null,
};

describe("quiz method selection policy", () => {
    it("allows every selectable reference method for a contextual quiz", () => {
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

    it("keeps the method ownership rule in one place", () => {
        expect(getQuizMethodAssociationError(QUIZ_KIND.contextual, "method-1")).toBeNull();
        expect(getQuizMethodAssociationError(QUIZ_KIND.methodKnowledge, null)).toContain(
            "lié à une méthode",
        );
        expect(getQuizMethodAssociationError(QUIZ_KIND.methodKnowledge, "method-1")).toBeNull();
        expect(normalizeQuizMethodId(QUIZ_KIND.contextual, "method-1")).toBe("method-1");
    });
});
