import { SCORECARD_STEP_WEIGHT_TOTAL_PERCENT } from "@/features/scorecards/domain";
import {
    createRoleplayTranscriptCorrectionLimiter,
    extractRoleplayTranscriptCorrectionCandidates,
    normalizeRoleplayTranscriptCorrection,
} from "@/features/roleplays/domain/transcript-correction";
import type {
    RoleplayNotationCriterionRef,
    RoleplayNotationScoreResult,
} from "@/features/roleplays/domain/roleplay-notation";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

export function buildScorecardMethodoPayload(
    rawMethodo: Record<string, unknown> | null,
    scoreResult: RoleplayNotationScoreResult,
    criterionRefs: RoleplayNotationCriterionRef[],
    transcription: RoleplayScorecardNotationContext["transcription"],
) {
    const refsByRef = new Map(criterionRefs.map((criterionRef) => [criterionRef.ref, criterionRef]));
    const raw = rawMethodo && typeof rawMethodo === "object" ? rawMethodo : {};
    const rawCriteria = Array.isArray(raw.criteres) ? raw.criteres.filter(isRecord) : [];
    const rawCriteriaByRef = new Map(
        rawCriteria.flatMap((criterion) => (
            typeof criterion.ref === "string" ? [[criterion.ref, criterion] as const] : []
        )),
    );
    const rawMetadata = Object.fromEntries(
        Object.entries(raw).filter(([key]) => (
            !["criteria", "criteria_results", "criteres", "etapes"].includes(key)
        )),
    );
    const limitTranscriptCorrection = createRoleplayTranscriptCorrectionLimiter();

    return {
        ...rawMetadata,
        onglet: raw.onglet ?? "AnalyseMethodologique",
        etapes: scoreResult.steps.map((step) => ({
            numero: step.stepOrder,
            titre: step.title,
            score: step.scorePercent,
            score_max: 100,
            points_obtenus: step.pointsAwarded,
            points_max: step.pointsMax,
            poids: round2(step.weightPercent / SCORECARD_STEP_WEIGHT_TOTAL_PERCENT),
            contribution_score_global: round2(
                step.scorePercent *
                    (step.weightPercent / SCORECARD_STEP_WEIGHT_TOTAL_PERCENT),
            ),
            commentaire_coach: step.coachComment,
            criteres: step.criteria.map((criterion) => {
                const criterionRef = refsByRef.get(criterion.ref);
                const rawCriterion = rawCriteriaByRef.get(criterion.ref);

                return {
                    ref: criterion.ref,
                    critere: criterionRef?.criterionKey ?? criterion.ref,
                    competence: criterionRef?.skillName,
                    dimension: criterionRef?.dimension,
                    item_dimension: criterionRef?.dimensionItemLabel,
                    points_obtenus: criterion.pointsAwarded,
                    points_max: criterion.pointsMax,
                    score: criterion.scorePercent,
                    preuve: criterion.evidence,
                    preuve_message_refs: criterion.evidenceMessageRefs ?? [],
                    commentaire: criterion.coachComment,
                    conseil: criterion.advice,
                    preuves_attendues: criterionRef?.expectedEvidence,
                    verbatim: criterionRef?.verbatim,
                    corrections: extractRoleplayTranscriptCorrectionCandidates(rawCriterion)
                        .flatMap((correction) => {
                            const normalized = limitTranscriptCorrection(
                                normalizeRoleplayTranscriptCorrection({
                                    correction,
                                    pointsAwarded: criterion.pointsAwarded,
                                    pointsMax: criterion.pointsMax,
                                    transcript: transcription.conversation,
                                }),
                            );

                            return normalized ? [normalized] : [];
                        }),
                };
            }),
        })),
    };
}
