import { describe, expect, it } from "vitest";
import { buildQuizSkillCriteria } from "./quiz-skill-criteria";

describe("buildQuizSkillCriteria", () => {
    it("only converts savoir questions into skill progression criteria", () => {
        const criteria = buildQuizSkillCriteria({
            answerChoices: [
                { answer_id: "answer-savoir", choice_id: "choice-savoir" },
                { answer_id: "answer-practice", choice_id: "choice-practice" },
            ],
            answers: [
                { attempt_id: "attempt-1", id: "answer-savoir", question_id: "question-savoir" },
                { attempt_id: "attempt-1", id: "answer-practice", question_id: "question-practice" },
            ],
            attempts: [
                {
                    completed_at: "2026-07-14T10:00:00.000Z",
                    created_at: "2026-07-14T09:00:00.000Z",
                    id: "attempt-1",
                    quiz_id: "quiz-1",
                },
            ],
            choices: [
                { id: "choice-savoir", is_correct: true, question_id: "question-savoir" },
                { id: "choice-practice", is_correct: true, question_id: "question-practice" },
            ],
            questions: [
                {
                    competence_id: "skill-1",
                    dimension: "savoir",
                    dimension_item_id: "item-savoir",
                    id: "question-savoir",
                    points: 1,
                    step_id: "step-1",
                },
                {
                    competence_id: "skill-1",
                    dimension: "savoir_faire",
                    dimension_item_id: "item-practice",
                    id: "question-practice",
                    points: 1,
                    step_id: "step-1",
                },
            ],
            steps: [{ id: "step-1", method_step_id: null, quiz_id: "quiz-1" }],
        });

        expect(criteria).toHaveLength(1);
        expect(criteria[0]).toMatchObject({
            dimension: "savoir",
            dimensionItemId: "item-savoir",
            scorePercent: 100,
        });
    });
});
