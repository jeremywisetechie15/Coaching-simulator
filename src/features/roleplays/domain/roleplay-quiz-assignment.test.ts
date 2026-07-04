import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import type { RoleplayQuizOption } from "./roleplay";
import {
    getAssignableRoleplayQuizOptions,
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
        title: "Quiz autre méthode",
    },
    {
        id: "66666666-6666-4666-8666-666666666666",
        kind: QUIZ_KIND.contextual,
        methodId,
        questionCount: 5,
        title: "Quiz contexte même méthode",
    },
];

describe("roleplay quiz assignment", () => {
    it("only exposes unlinked quizzes once a method is selected", () => {
        expect(getAssignableRoleplayQuizOptions(quizzes, methodId).map((quiz) => quiz.id)).toEqual([
            "11111111-1111-4111-8111-111111111111",
        ]);
    });

    it("does not expose any quiz before a method is selected", () => {
        expect(getAssignableRoleplayQuizOptions(quizzes, null)).toEqual([]);
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

    it("rejects quizzes linked to another method", () => {
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
                title: "Quiz autre méthode",
            },
        ]);
    });

    it("rejects contextual quizzes already linked to the selected method", () => {
        expect(
            validateRoleplayQuizAssignments({
                methodId,
                quizIds: ["66666666-6666-4666-8666-666666666666"],
                quizzes,
            }),
        ).toEqual([
            {
                code: "quiz_linked_to_selected_method",
                quizId: "66666666-6666-4666-8666-666666666666",
                title: "Quiz contexte même méthode",
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
                code: "quiz_linked_to_selected_method",
                quizId: "22222222-2222-4222-8222-222222222222",
                title: "Quiz de la méthode",
            },
        ]);
    });
});
