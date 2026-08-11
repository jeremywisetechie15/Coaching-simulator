import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import type { RoleplayQuizOption } from "./roleplay";
import {
    getAssignableRoleplayQuizOptions,
    getRoleplayMethodKnowledgeQuizOption,
    isRoleplayQuizAssignableForMethod,
    validateRoleplayQuizAssignments,
} from "./roleplay-quiz-assignment";

const methodId = "33333333-3333-4333-8333-333333333333";
const otherMethodId = "44444444-4444-4444-8444-444444444444";

const quizzes: RoleplayQuizOption[] = [
    {
        id: "11111111-1111-4111-8111-111111111111",
        kind: QUIZ_KIND.contextual,
        methodId: null,
        questionCount: 4,
        title: "Quiz produit",
    },
    {
        id: "22222222-2222-4222-8222-222222222222",
        kind: QUIZ_KIND.methodKnowledge,
        methodId,
        questionCount: 6,
        title: "Quiz de la méthode",
    },
    {
        id: "55555555-5555-4555-8555-555555555555",
        kind: QUIZ_KIND.contextual,
        methodId: otherMethodId,
        questionCount: 3,
        title: "Ancien quiz contextuel incohérent",
    },
    {
        id: "66666666-6666-4666-8666-666666666666",
        kind: QUIZ_KIND.contextual,
        methodId,
        questionCount: 5,
        title: "Quiz contexte même méthode",
    },
    {
        id: "77777777-7777-4777-8777-777777777777",
        kind: QUIZ_KIND.methodKnowledge,
        methodId: otherMethodId,
        questionCount: 7,
        title: "Quiz principal d'une autre méthode",
    },
];

describe("roleplay quiz assignment", () => {
    it("rejects an unavailable quiz even when its method matches", () => {
        expect(isRoleplayQuizAssignableForMethod({
            id: "quiz-unavailable",
            isSelectable: false,
            kind: QUIZ_KIND.contextual,
            methodId,
        }, methodId)).toBe(false);
    });

    it("exposes contextual quizzes without a method or with the roleplay method", () => {
        expect(getAssignableRoleplayQuizOptions(quizzes, methodId).map((quiz) => quiz.id)).toEqual([
            "11111111-1111-4111-8111-111111111111",
            "66666666-6666-4666-8666-666666666666",
        ]);
    });

    it("does not expose any quiz before a method is selected", () => {
        expect(getAssignableRoleplayQuizOptions(quizzes, null)).toEqual([]);
    });

    it("returns the knowledge quiz attached to the selected method", () => {
        expect(getRoleplayMethodKnowledgeQuizOption(quizzes, methodId)?.id).toBe(
            "22222222-2222-4222-8222-222222222222",
        );
    });

    it("does not return a method quiz before a method is selected", () => {
        expect(getRoleplayMethodKnowledgeQuizOption(quizzes, null)).toBeNull();
    });

    it("ignores contextual quizzes attached to the selected method", () => {
        expect(
            getRoleplayMethodKnowledgeQuizOption(
                quizzes.filter((quiz) => quiz.kind === QUIZ_KIND.contextual),
                methodId,
            ),
        ).toBeNull();
    });

    it("accepts unlinked quizzes", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["11111111-1111-4111-8111-111111111111"],
                quizzes,
            }),
        ).toEqual([]);
    });

    it("rejects contextual quizzes linked to another method", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["55555555-5555-4555-8555-555555555555"],
                quizzes,
            }),
        ).toEqual([
            {
                code: "quiz_linked_to_other_method",
                quizId: "55555555-5555-4555-8555-555555555555",
                title: "Ancien quiz contextuel incohérent",
            },
        ]);
    });

    it("accepts contextual quizzes linked to the selected method", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["66666666-6666-4666-8666-666666666666"],
                quizzes,
            }),
        ).toEqual([]);
    });

    it("rejects the knowledge quiz of another method", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["77777777-7777-4777-8777-777777777777"],
                quizzes,
            }),
        ).toEqual([
            {
                code: "quiz_linked_to_other_method",
                quizId: "77777777-7777-4777-8777-777777777777",
                title: "Quiz principal d'une autre méthode",
            },
        ]);
    });

    it("rejects the knowledge quiz already attached to the selected method", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["22222222-2222-4222-8222-222222222222"],
                quizzes,
            }),
        ).toEqual([
            {
                code: "selected_method_knowledge_quiz",
                quizId: "22222222-2222-4222-8222-222222222222",
                title: "Quiz de la méthode",
            },
        ]);
    });
});
