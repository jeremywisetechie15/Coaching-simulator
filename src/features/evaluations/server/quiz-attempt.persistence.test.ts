import { describe, expect, it } from "vitest";
import type { QuizDetail } from "@/features/evaluations/domain";
import {
    createQuizAttemptStepScoreRows,
    normalizeQuizAttemptAnswers,
    scoreQuizAttempt,
} from "./quiz-attempt.persistence";

const quiz = {
    validationThreshold: 70,
    steps: [
        {
            competenceIds: ["skill-1"],
            id: "step-1",
            methodStepId: null,
            name: "Accroche",
            order: 1,
            questions: [
                {
                    attachments: [],
                    choices: [
                        { id: "choice-1", isCorrect: true, label: "A", order: 1 },
                        { id: "choice-2", isCorrect: false, label: "B", order: 2 },
                    ],
                    competenceId: "skill-1",
                    dimension: "savoir",
                    dimensionItem: "Connaissance",
                    dimensionItemId: null,
                    explanation: "",
                    id: "question-1",
                    order: 1,
                    points: 2,
                    prompt: "QCU ?",
                    type: "QCU",
                },
            ],
            weight: 40,
        },
        {
            competenceIds: ["skill-2"],
            id: "step-2",
            methodStepId: null,
            name: "Traitement",
            order: 2,
            questions: [
                {
                    attachments: [],
                    choices: [
                        { id: "choice-3", isCorrect: true, label: "A", order: 1 },
                        { id: "choice-4", isCorrect: true, label: "B", order: 2 },
                        { id: "choice-5", isCorrect: false, label: "C", order: 3 },
                    ],
                    competenceId: "skill-2",
                    dimension: "savoir_faire",
                    dimensionItem: "Application",
                    dimensionItemId: null,
                    explanation: "",
                    id: "question-2",
                    order: 1,
                    points: 2,
                    prompt: "QCM ?",
                    type: "QCM",
                },
            ],
            weight: 60,
        },
    ],
} satisfies Pick<QuizDetail, "steps" | "validationThreshold">;

describe("quiz attempt persistence helpers", () => {
    it("normalizes answers and removes duplicates", () => {
        const result = normalizeQuizAttemptAnswers(quiz, [
            { questionId: "question-2", choiceIds: ["choice-3", "choice-3", "choice-4"] },
        ]);

        expect(result).toEqual([
            {
                questionId: "question-2",
                choiceIds: ["choice-3", "choice-4"],
            },
        ]);
    });

    it("rejects answers that do not belong to the quiz", () => {
        expect(() =>
            normalizeQuizAttemptAnswers(quiz, [
                { questionId: "question-1", choiceIds: ["choice-3"] },
            ]),
        ).toThrow("Une réponse ne correspond pas à cette question.");
    });

    it("scores QCU and QCM answers with exact matching and weighted steps", () => {
        const result = scoreQuizAttempt(quiz, [
            { questionId: "question-1", choiceIds: ["choice-1"] },
            { questionId: "question-2", choiceIds: ["choice-3"] },
        ]);

        expect(result.stepScores).toEqual([
            {
                earnedPoints: 2,
                maxPoints: 2,
                scorePercent: 100,
                stepId: "step-1",
                weight: 40,
            },
            {
                earnedPoints: 0,
                maxPoints: 2,
                scorePercent: 0,
                stepId: "step-2",
                weight: 60,
            },
        ]);
        expect(result.scorePercent).toBe(40);
        expect(result.passed).toBe(false);
    });

    it("creates persisted step score rows", () => {
        const score = scoreQuizAttempt(quiz, [
            { questionId: "question-1", choiceIds: ["choice-1"] },
            { questionId: "question-2", choiceIds: ["choice-3", "choice-4"] },
        ]);

        expect(createQuizAttemptStepScoreRows("attempt-1", score)).toEqual([
            {
                attempt_id: "attempt-1",
                earned_points: 2,
                max_points: 2,
                quiz_step_id: "step-1",
                score_percent: 100,
                weight: 40,
            },
            {
                attempt_id: "attempt-1",
                earned_points: 2,
                max_points: 2,
                quiz_step_id: "step-2",
                score_percent: 100,
                weight: 60,
            },
        ]);
    });
});
