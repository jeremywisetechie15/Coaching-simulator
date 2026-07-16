import { describe, expect, it } from "vitest";
import { mergeRoleplayProgressQuizIds } from "./get-roleplay-progress";

describe("mergeRoleplayProgressQuizIds", () => {
    it("combines the method quiz and roleplay quizzes without duplicates", () => {
        expect(
            mergeRoleplayProgressQuizIds(
                ["quiz-method"],
                ["quiz-contextual", "quiz-method"],
            ),
        ).toEqual(["quiz-method", "quiz-contextual"]);
    });
});
