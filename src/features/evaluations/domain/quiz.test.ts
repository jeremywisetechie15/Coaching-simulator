import { describe, expect, it } from "vitest";
import { scoreQuizAnswers } from "./quiz";

describe("scoreQuizAnswers", () => {
    it("scores QCU and QCM questions with exact-match answers", () => {
        const result = scoreQuizAnswers(
            {
                validationThreshold: 70,
                steps: [
                    {
                        competenceIds: ["acces-decideur"],
                        id: "step-1",
                        methodStepId: null,
                        name: "Accroche",
                        order: 1,
                        weight: 50,
                        questions: [
                            {
                                attachments: [],
                                choices: [
                                    { id: "choice-1", isCorrect: true, label: "A", order: 1 },
                                    { id: "choice-2", isCorrect: false, label: "B", order: 2 },
                                ],
                                competenceId: "acces-decideur",
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
                    },
                    {
                        competenceIds: ["gestion-objections"],
                        id: "step-2",
                        methodStepId: null,
                        name: "Traitement",
                        order: 2,
                        weight: 50,
                        questions: [
                            {
                                attachments: [],
                                choices: [
                                    { id: "choice-3", isCorrect: true, label: "A", order: 1 },
                                    { id: "choice-4", isCorrect: true, label: "B", order: 2 },
                                    { id: "choice-5", isCorrect: false, label: "C", order: 3 },
                                ],
                                competenceId: "gestion-objections",
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
                    },
                ],
            },
            {
                "question-1": ["choice-1"],
                "question-2": ["choice-3"],
            },
        );

        expect(result.sections).toEqual([
            {
                earnedPoints: 2,
                maxPoints: 2,
                score: 100,
                stepId: "step-1",
                weight: 50,
            },
            {
                earnedPoints: 0,
                maxPoints: 2,
                score: 0,
                stepId: "step-2",
                weight: 50,
            },
        ]);
        expect(result.score).toBe(50);
        expect(result.passed).toBe(false);
    });

    it("falls back to point ratio when no step weighting is defined", () => {
        const result = scoreQuizAnswers(
            {
                validationThreshold: 50,
                steps: [
                    {
                        competenceIds: [],
                        id: "step-1",
                        methodStepId: null,
                        name: "Étape",
                        order: 1,
                        weight: 0,
                        questions: [
                            {
                                attachments: [],
                                choices: [
                                    { id: "choice-1", isCorrect: true, label: "A", order: 1 },
                                    { id: "choice-2", isCorrect: false, label: "B", order: 2 },
                                ],
                                competenceId: "",
                                dimension: "savoir",
                                dimensionItem: "",
                                dimensionItemId: null,
                                explanation: "",
                                id: "question-1",
                                order: 1,
                                points: 3,
                                prompt: "Question 1",
                                type: "QCU",
                            },
                            {
                                attachments: [],
                                choices: [
                                    { id: "choice-3", isCorrect: true, label: "A", order: 1 },
                                    { id: "choice-4", isCorrect: false, label: "B", order: 2 },
                                ],
                                competenceId: "",
                                dimension: "savoir",
                                dimensionItem: "",
                                dimensionItemId: null,
                                explanation: "",
                                id: "question-2",
                                order: 2,
                                points: 1,
                                prompt: "Question 2",
                                type: "QCU",
                            },
                        ],
                    },
                ],
            },
            {
                "question-1": ["choice-1"],
                "question-2": ["choice-4"],
            },
        );

        expect(result.score).toBe(75);
        expect(result.passed).toBe(true);
    });
});
