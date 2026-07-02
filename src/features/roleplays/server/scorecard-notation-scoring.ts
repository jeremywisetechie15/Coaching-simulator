import type {
    RoleplayNotationCriterionRef,
    RoleplayNotationCriterionResult,
    RoleplayNotationScoreResult,
    RoleplayNotationStepResult,
} from "@/features/roleplays/domain";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.replace("%", "").trim());
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function getRecordArray(value: unknown): JsonRecord[] {
    if (!Array.isArray(value)) return [];
    return value.filter(isRecord);
}

function getCriterionArrays(step: JsonRecord) {
    const direct = getRecordArray(step.criteria);
    const french = getRecordArray(step.criteres);
    const grille = isRecord(step.grille_calcul) ? getRecordArray(step.grille_calcul.criteres) : [];

    return [...direct, ...french, ...grille];
}

function getAllCriterionRecords(methodoResult: JsonRecord | null) {
    if (!methodoResult) return [];

    const fromSteps = getRecordArray(methodoResult.etapes).flatMap(getCriterionArrays);
    const direct = getRecordArray(methodoResult.criteria);
    const french = getRecordArray(methodoResult.criteres);
    const results = getRecordArray(methodoResult.criteria_results);

    return [...fromSteps, ...direct, ...french, ...results];
}

function extractRef(criterion: JsonRecord) {
    return (
        asString(criterion.ref) ||
        asString(criterion.criterion_ref) ||
        asString(criterion.critere_ref) ||
        asString(criterion.reference)
    );
}

function extractPoints(criterion: JsonRecord) {
    return (
        asNumber(criterion.points_obtenus) ??
        asNumber(criterion.points_awarded) ??
        asNumber(criterion.score_obtenu) ??
        asNumber(criterion.note) ??
        asNumber(criterion.score)
    );
}

function extractText(criterion: JsonRecord, keys: string[]) {
    for (const key of keys) {
        const value = asString(criterion[key]);
        if (value) return value;
    }
    return "";
}

function normalizeCriterionResult(
    criterionRef: RoleplayNotationCriterionRef,
    rawCriterion: JsonRecord | null,
): RoleplayNotationCriterionResult {
    const rawPoints = rawCriterion ? extractPoints(rawCriterion) : 0;
    const pointsAwarded = round2(clamp(rawPoints ?? 0, 0, criterionRef.maxPoints));
    const scorePercent = criterionRef.maxPoints > 0 ? round2((pointsAwarded / criterionRef.maxPoints) * 100) : 0;

    return {
        advice: rawCriterion
            ? extractText(rawCriterion, ["conseil", "advice", "conseils", "recommendation", "recommandation"])
            : "",
        coachComment: rawCriterion
            ? extractText(rawCriterion, ["commentaire", "commentaire_coach", "coach_comment", "analyse"])
            : "",
        evidence: rawCriterion
            ? extractText(rawCriterion, ["preuve", "preuves_observees", "observed_evidence", "evidence"])
            : "",
        pointsAwarded,
        pointsMax: criterionRef.maxPoints,
        ref: criterionRef.ref,
        scorePercent,
    };
}

export function calculateScorecardNotationResult(
    methodoResult: JsonRecord | null,
    criterionRefs: RoleplayNotationCriterionRef[],
): RoleplayNotationScoreResult {
    const criteriaByRef = new Map<string, JsonRecord>();
    for (const criterion of getAllCriterionRecords(methodoResult)) {
        const ref = extractRef(criterion);
        if (ref && !criteriaByRef.has(ref)) {
            criteriaByRef.set(ref, criterion);
        }
    }

    const criteria = criterionRefs.map((criterionRef) =>
        normalizeCriterionResult(criterionRef, criteriaByRef.get(criterionRef.ref) ?? null),
    );
    const criteriaByStepId = new Map<string, RoleplayNotationCriterionResult[]>();
    const refsByRef = new Map(criterionRefs.map((criterionRef) => [criterionRef.ref, criterionRef]));

    for (const criterion of criteria) {
        const criterionRef = refsByRef.get(criterion.ref);
        if (!criterionRef) continue;
        const current = criteriaByStepId.get(criterionRef.scorecardStepId) ?? [];
        current.push(criterion);
        criteriaByStepId.set(criterionRef.scorecardStepId, current);
    }

    const firstRefByStepId = new Map<string, RoleplayNotationCriterionRef>();
    for (const criterionRef of criterionRefs) {
        if (!firstRefByStepId.has(criterionRef.scorecardStepId)) {
            firstRefByStepId.set(criterionRef.scorecardStepId, criterionRef);
        }
    }

    const steps: RoleplayNotationStepResult[] = Array.from(firstRefByStepId.values())
        .sort((first, second) => first.stepOrder - second.stepOrder)
        .map((criterionRef) => {
            const stepCriteria = criteriaByStepId.get(criterionRef.scorecardStepId) ?? [];
            const pointsAwarded = round2(stepCriteria.reduce((total, criterion) => total + criterion.pointsAwarded, 0));
            const pointsMax = round2(stepCriteria.reduce((total, criterion) => total + criterion.pointsMax, 0));
            const scorePercent = pointsMax > 0 ? round2((pointsAwarded / pointsMax) * 100) : 0;
            const coachComment =
                stepCriteria.find((criterion) => criterion.coachComment)?.coachComment ||
                stepCriteria.find((criterion) => criterion.advice)?.advice ||
                "";

            return {
                coachComment,
                criteria: stepCriteria,
                methodStepId: criterionRef.methodStepId,
                pointsAwarded,
                pointsMax,
                scorePercent,
                scorecardStepId: criterionRef.scorecardStepId,
                stepOrder: criterionRef.stepOrder,
                title: criterionRef.stepTitle,
            };
        });

    const pointsAwarded = round2(criteria.reduce((total, criterion) => total + criterion.pointsAwarded, 0));
    const pointsMax = round2(criteria.reduce((total, criterion) => total + criterion.pointsMax, 0));
    const globalScorePercent = pointsMax > 0 ? round2((pointsAwarded / pointsMax) * 100) : 0;

    return {
        criteria,
        globalScorePercent,
        pointsAwarded,
        pointsMax,
        steps,
    };
}

export function buildScoreGlobalFromScorecard(result: RoleplayNotationScoreResult) {
    const detail_calcul = result.steps.map((step) => {
        const poids = result.pointsMax > 0 ? round2(step.pointsMax / result.pointsMax) : 0;

        return {
            etape: step.title,
            poids,
            points_obtenus: step.pointsAwarded,
            points_max: step.pointsMax,
            score_etape: step.scorePercent,
            contribution: round2(step.scorePercent * poids),
        };
    });

    return {
        unite: "score_sur_100",
        valeur: result.globalScorePercent,
        detail_calcul,
        points_obtenus: result.pointsAwarded,
        points_max: result.pointsMax,
        methode_calcul: "somme_points_criteres_scorecard",
        score_process: result.globalScorePercent,
        notation_source: "scorecard",
    };
}
