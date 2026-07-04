import { describe, expect, it } from "vitest";
import type { Evaluation, EvaluationStep } from "@/features/roleplays/data/evaluation";
import { buildEvaluationScoreDetails } from "./evaluation-score-details";

function step(number: number, score: number): EvaluationStep {
    return {
        criteria: [],
        icon: number === 1 ? "phone" : number === 2 ? "message" : number === 3 ? "shield" : "check",
        number,
        score,
        status: score >= 80 ? "À maintenir" : score >= 60 ? "À consolider" : "À renforcer",
        title: `Étape ${number}`,
        total: `${score}/100`,
    };
}

function evaluation(overrides: Partial<Evaluation> = {}): Evaluation {
    return {
        axesAmelioration: [],
        coachAppreciation: "",
        discourse: [],
        personaAvis: "",
        planEtape: { number: 1, text: "", title: "" },
        pointsPositifs: [],
        prioriteStrategique: "",
        steps: [step(1, 50), step(2, 80), step(3, 40), step(4, 100)],
        transcript: [],
        ...overrides,
    };
}

describe("buildEvaluationScoreDetails", () => {
    it("uses score details from notation when available", () => {
        const details = buildEvaluationScoreDetails(
            evaluation({
                scoreDetails: {
                    rows: [
                        { contribution: 12.5, poids: 25, score: 50, stepNumber: 1, title: "Ouverture" },
                        { contribution: 20, poids: 25, score: 80, stepNumber: 2, title: "Accroche" },
                    ],
                    total: 33,
                },
            }),
        );

        expect(details.hasSourceDetails).toBe(true);
        expect(details.total).toBe(33);
        expect(details.rows).toEqual([
            { contribution: 12.5, poids: 25, score: 50, stepNumber: 1, title: "Ouverture" },
            { contribution: 20, poids: 25, score: 80, stepNumber: 2, title: "Accroche" },
        ]);
    });

    it("falls back to default step weights when notation details are missing", () => {
        const details = buildEvaluationScoreDetails(evaluation());

        expect(details.hasSourceDetails).toBe(false);
        expect(details.rows.map((row) => row.poids)).toEqual([20, 30, 25, 25]);
        expect(details.total).toBe(69);
    });
});
