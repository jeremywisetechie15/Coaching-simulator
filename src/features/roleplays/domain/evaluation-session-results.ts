import type { Evaluation, EvaluationCriterion, EvaluationStep, StepStatus } from "@/features/roleplays/data/evaluation";
import {
    ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT,
    ROLEPLAY_MASTERY_THRESHOLD_PERCENT,
} from "./roleplay-score";

export interface EvaluationSessionStepResult {
    coachComment: string | null;
    pointsAwarded: number | null;
    pointsMax: number | null;
    scorePercent: number;
    scorecardStepId: string | null;
    stepOrder: number;
    title: string;
}

export interface EvaluationSessionCriterionResult {
    advice: string | null;
    coachComment: string | null;
    criterionKey: string | null;
    criterionOrder: number | null;
    criterionRef: string;
    dimensionItemLabel: string | null;
    evidence: string | null;
    expectedEvidence: string | null;
    pointsAwarded: number;
    pointsMax: number;
    scorePercent: number;
    scorecardStepId: string | null;
    skillName: string | null;
    verbatim: string | null;
}

export interface EvaluationSessionResults {
    criteria: EvaluationSessionCriterionResult[];
    steps: EvaluationSessionStepResult[];
}

const STEP_ICONS: EvaluationStep["icon"][] = ["phone", "message", "shield", "check"];

function clampScore(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function stepStatus(score: number): StepStatus {
    if (score >= ROLEPLAY_MASTERY_THRESHOLD_PERCENT) return "À maintenir";
    if (score >= ROLEPLAY_CONSOLIDATION_THRESHOLD_PERCENT) return "À consolider";
    return "À renforcer";
}

function formatNumber(value: number | null | undefined) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}

function formatPoints(pointsAwarded: number | null, pointsMax: number | null, scorePercent: number) {
    const awarded = formatNumber(pointsAwarded);
    const max = formatNumber(pointsMax);
    if (awarded && max) return `${awarded}/${max}`;
    return `${clampScore(scorePercent)}%`;
}

function parseEvidenceItem(value: string): EvaluationCriterion["preuvesObservees"][number] {
    const match = value.match(
        /^(?:(\d{1,2}:\d{2}(?::\d{2})?(?:\s*-\s*\d{1,2}:\d{2}(?::\d{2})?)?)\s+)?(?:(Apprenant|Utilisateur|User|Persona|Assistant)\s*:\s*)?(.+)$/i,
    );

    return {
        quote: match?.[3]?.trim() || value,
        speaker: match?.[2]?.trim() || "Apprenant",
        time: match?.[1]?.trim() || "",
    };
}

function splitEvidence(value: string | null): EvaluationCriterion["preuvesObservees"] {
    if (!value?.trim()) return [];

    return value
        .split(/\s+\|\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
        .map(parseEvidenceItem);
}

function criterionTitle(row: EvaluationSessionCriterionResult) {
    return row.criterionKey || row.dimensionItemLabel || row.criterionRef;
}

function mapCriterion(row: EvaluationSessionCriterionResult): EvaluationCriterion {
    return {
        analyse: row.coachComment || "-",
        competence: row.skillName || undefined,
        conseils: row.advice || "-",
        critere: criterionTitle(row),
        points: formatPoints(row.pointsAwarded, row.pointsMax, row.scorePercent),
        preuvesAttendues: row.expectedEvidence || "-",
        preuvesObservees: splitEvidence(row.evidence),
        verbatim: row.verbatim || "-",
    };
}

function summarizeCriteria(criteria: EvaluationSessionCriterionResult[]) {
    const reussis: string[] = [];
    const ameliorer: string[] = [];

    for (const criterion of criteria) {
        if (criterion.scorePercent >= 70) {
            reussis.push(criterionTitle(criterion));
        } else {
            ameliorer.push(criterionTitle(criterion));
        }
    }

    return { ameliorer, reussis };
}

export function applyEvaluationSessionResults(
    evaluation: Evaluation,
    results: EvaluationSessionResults,
): Evaluation {
    if (results.steps.length === 0 && results.criteria.length === 0) {
        return evaluation;
    }

    const criteriaByStepId = new Map<string, EvaluationSessionCriterionResult[]>();
    for (const criterion of results.criteria) {
        if (!criterion.scorecardStepId) continue;
        const current = criteriaByStepId.get(criterion.scorecardStepId) ?? [];
        current.push(criterion);
        criteriaByStepId.set(criterion.scorecardStepId, current);
    }

    const steps = results.steps
        .slice()
        .sort((first, second) => first.stepOrder - second.stepOrder)
        .map((step, index): EvaluationStep => {
            const baseStep =
                evaluation.steps.find((item) => item.number === step.stepOrder) ??
                evaluation.steps.find((item) => item.title === step.title);
            const score = clampScore(step.scorePercent);
            const stepCriteria = (step.scorecardStepId ? criteriaByStepId.get(step.scorecardStepId) ?? [] : [])
                .slice()
                .sort((first, second) => {
                    if (first.criterionOrder !== null && second.criterionOrder !== null) {
                        return first.criterionOrder - second.criterionOrder;
                    }
                    if (first.criterionOrder !== null) return -1;
                    if (second.criterionOrder !== null) return 1;
                    return first.criterionRef.localeCompare(second.criterionRef);
                });
            const summaries = summarizeCriteria(stepCriteria);
            const normalizedCriteria = stepCriteria.map(mapCriterion);

            return {
                ...(baseStep ?? {
                    icon: STEP_ICONS[index % STEP_ICONS.length],
                    number: step.stepOrder,
                    status: stepStatus(score),
                    title: step.title,
                    total: formatPoints(step.pointsAwarded, step.pointsMax, score),
                }),
                commentaireCoach: step.coachComment || baseStep?.commentaireCoach,
                criteria: normalizedCriteria.length > 0 ? normalizedCriteria : baseStep?.criteria ?? [],
                criteresAAmeliorer:
                    summaries.ameliorer.length > 0 ? summaries.ameliorer : baseStep?.criteresAAmeliorer,
                criteresReussis:
                    summaries.reussis.length > 0 ? summaries.reussis : baseStep?.criteresReussis,
                icon: baseStep?.icon ?? STEP_ICONS[index % STEP_ICONS.length],
                number: step.stepOrder,
                score,
                status: stepStatus(score),
                title: step.title || baseStep?.title || `Étape ${step.stepOrder}`,
                total: formatPoints(step.pointsAwarded, step.pointsMax, score),
            };
        });

    return {
        ...evaluation,
        steps,
    };
}
