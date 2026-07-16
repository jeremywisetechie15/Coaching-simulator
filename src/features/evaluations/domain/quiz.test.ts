import { describe, expect, it } from "vitest";
import {
    getQuizAttemptsRemaining,
    getQuizDimensionDiagnostic,
    getQuizResumeQuestionIndex,
    hasActiveQuizKnowledgeItem,
    hasReachedQuizAttemptLimit,
    normalizeQuizMaxAttempts,
    scoreQuizAnswers,
} from "./quiz";

describe("quiz attempt limits", () => {
    it("uses the default for an omitted limit and preserves unlimited attempts", () => {
        expect(normalizeQuizMaxAttempts(undefined)).toBe(3);
        expect(normalizeQuizMaxAttempts(null)).toBeNull();
    });

    it("calculates the remaining finite attempts and preserves unlimited attempts", () => {
        expect(getQuizAttemptsRemaining(3, 1)).toBe(2);
        expect(getQuizAttemptsRemaining(3, 4)).toBe(0);
        expect(getQuizAttemptsRemaining(null, 100)).toBeNull();
    });

    it("only reports a reached limit for finite attempts", () => {
        expect(hasReachedQuizAttemptLimit(3, 2)).toBe(false);
        expect(hasReachedQuizAttemptLimit(3, 3)).toBe(true);
        expect(hasReachedQuizAttemptLimit(3, 4)).toBe(true);
        expect(hasReachedQuizAttemptLimit(null, 100)).toBe(false);
    });
});

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
                                dimension: "savoir",
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

describe("hasActiveQuizKnowledgeItem", () => {
    it("only exposes skills with an active savoir item", () => {
        expect(hasActiveQuizKnowledgeItem({
            dimensionItems: [
                { dimension: "savoir", isActive: true },
                { dimension: "savoir_faire", isActive: true },
            ],
        })).toBe(true);
        expect(hasActiveQuizKnowledgeItem({
            dimensionItems: [
                { dimension: "savoir", isActive: false },
                { dimension: "savoir_faire", isActive: true },
            ],
        })).toBe(false);
    });
});

describe("getQuizResumeQuestionIndex", () => {
    const quiz = {
        steps: [
            {
                competenceIds: [],
                id: "step-1",
                methodStepId: null,
                name: "Étape 1",
                order: 1,
                weight: 50,
                questions: [
                    {
                        attachments: [],
                        choices: [],
                        competenceId: "",
                        dimension: "savoir" as const,
                        dimensionItem: "",
                        dimensionItemId: null,
                        explanation: "",
                        id: "question-1",
                        order: 1,
                        points: 1,
                        prompt: "Question 1",
                        type: "QCU" as const,
                    },
                    {
                        attachments: [],
                        choices: [],
                        competenceId: "",
                        dimension: "savoir" as const,
                        dimensionItem: "",
                        dimensionItemId: null,
                        explanation: "",
                        id: "question-2",
                        order: 2,
                        points: 1,
                        prompt: "Question 2",
                        type: "QCU" as const,
                    },
                ],
            },
            {
                competenceIds: [],
                id: "step-2",
                methodStepId: null,
                name: "Étape 2",
                order: 2,
                weight: 50,
                questions: [
                    {
                        attachments: [],
                        choices: [],
                        competenceId: "",
                        dimension: "savoir" as const,
                        dimensionItem: "",
                        dimensionItemId: null,
                        explanation: "",
                        id: "question-3",
                        order: 1,
                        points: 1,
                        prompt: "Question 3",
                        type: "QCM" as const,
                    },
                ],
            },
        ],
    };

    it("returns the first unanswered question index", () => {
        expect(
            getQuizResumeQuestionIndex(quiz, {
                "question-1": ["choice-1"],
            }),
        ).toBe(1);
    });

    it("returns the last question index when all questions are answered but not submitted", () => {
        expect(
            getQuizResumeQuestionIndex(quiz, {
                "question-1": ["choice-1"],
                "question-2": ["choice-2"],
                "question-3": ["choice-3"],
            }),
        ).toBe(2);
    });
});

describe("getQuizDimensionDiagnostic", () => {
    it("returns the deterministic MVP message from score thresholds", () => {
        expect(getQuizDimensionDiagnostic(80, 70)).toBe(
            "Cette compétence est maîtrisée. Continuez à l'entretenir lors de vos prochains entraînements.",
        );
        expect(getQuizDimensionDiagnostic(60, 70)).toBe(
            "Les bases sont là, mais des points restent à consolider. Quelques révisions ciblées suffiront.",
        );
        expect(getQuizDimensionDiagnostic(40, 70)).toBe(
            "Des lacunes importantes ont été identifiées. Une révision approfondie de cette compétence est nécessaire.",
        );
    });
});
