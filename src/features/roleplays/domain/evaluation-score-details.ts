import type { Evaluation } from "@/features/roleplays/data/evaluation";

export interface EvaluationScoreDetailRow {
    contribution: number;
    poids: number;
    score: number;
    stepNumber: number;
    title: string;
}

export interface EvaluationScoreDetails {
    hasSourceDetails: boolean;
    rows: EvaluationScoreDetailRow[];
    total: number;
}

const FALLBACK_STEP_WEIGHTS = [20, 30, 25, 25];

export function buildEvaluationScoreDetails(evaluation: Evaluation): EvaluationScoreDetails {
    const sourceRows = evaluation.scoreDetails?.rows ?? [];

    if (sourceRows.length > 0) {
        return {
            hasSourceDetails: true,
            rows: sourceRows.map((detail, index) => {
                const step = evaluation.steps.find((item) => item.number === detail.stepNumber) ?? evaluation.steps[index];

                return {
                    contribution: detail.contribution,
                    poids: detail.poids,
                    score: detail.score,
                    stepNumber: detail.stepNumber,
                    title: detail.title || step?.title || `Étape ${detail.stepNumber}`,
                };
            }),
            total: evaluation.scoreDetails?.total ?? Math.round(sourceRows.reduce((sum, row) => sum + row.contribution, 0)),
        };
    }

    const fallbackWeight = evaluation.steps.length > 0 ? Math.round(100 / evaluation.steps.length) : 0;
    const rows = evaluation.steps.map((step, index) => {
        const poids = FALLBACK_STEP_WEIGHTS[index] ?? fallbackWeight;

        return {
            contribution: Math.round(step.score * poids) / 100,
            poids,
            score: step.score,
            stepNumber: step.number,
            title: step.title,
        };
    });

    return {
        hasSourceDetails: false,
        rows,
        total: Math.round(rows.reduce((sum, row) => sum + row.contribution, 0)),
    };
}
