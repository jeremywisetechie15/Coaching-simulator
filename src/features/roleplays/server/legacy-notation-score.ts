type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value.replace("%", "").replace(",", ".").trim());
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function clamp0_100(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function getRecordPath(root: JsonRecord, path: string[]) {
    let current: unknown = root;
    for (const key of path) {
        if (!isRecord(current)) return null;
        current = current[key];
    }

    return isRecord(current) ? current : null;
}

function getCriterionArrays(step: JsonRecord): JsonRecord[] {
    const fromGrid = getRecordPath(step, ["grille_calcul"]);
    const candidates = [
        Array.isArray(fromGrid?.criteres) ? fromGrid.criteres : [],
        Array.isArray(step.criteres) ? step.criteres : [],
        Array.isArray(step.criteria) ? step.criteria : [],
    ];

    return candidates.flat().filter(isRecord);
}

function scoreFromScoreDetail(step: JsonRecord) {
    const detail = getRecordPath(step, ["grille_calcul", "score_detail"]) ?? getRecordPath(step, ["score_detail"]);
    if (!detail) return null;

    const percentage = asNumber(detail.pourcentage) ?? asNumber(detail.percentage) ?? asNumber(detail.score);
    if (percentage !== null) return clamp0_100(percentage);

    const total = asNumber(detail.total_obtenu) ?? asNumber(detail.points_obtenus) ?? asNumber(detail.points_awarded);
    const max = asNumber(detail.total_max) ?? asNumber(detail.points_max) ?? asNumber(detail.max_points);

    if (total !== null && max !== null && max > 0) {
        return clamp0_100((total / max) * 100);
    }

    return null;
}

function scoreFromCriteria(step: JsonRecord) {
    const criteria = getCriterionArrays(step);
    if (criteria.length === 0) return null;

    let total = 0;
    let max = 0;

    for (const criterion of criteria) {
        const score =
            asNumber(criterion.score_obtenu) ??
            asNumber(criterion.points_obtenus) ??
            asNumber(criterion.points_awarded) ??
            asNumber(criterion.note);
        const scoreMax = asNumber(criterion.score_max) ?? asNumber(criterion.points_max) ?? asNumber(criterion.max_points);

        if (score === null || scoreMax === null || scoreMax <= 0) continue;

        total += Math.max(0, score);
        max += scoreMax;
    }

    return max > 0 ? clamp0_100((total / max) * 100) : null;
}

export function calculateLegacyMethodoStepScore(step: JsonRecord | null | undefined) {
    if (!step) return 0;

    return clamp0_100(
        scoreFromScoreDetail(step) ??
        scoreFromCriteria(step) ??
        asNumber(step.score) ??
        0,
    );
}
