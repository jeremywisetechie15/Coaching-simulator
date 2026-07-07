import { CONTENT_STATUS, normalizeContentStatus } from "@/features/content/domain";
import {
    SCORECARD_CRITERION_DIMENSIONS,
    scorecardScopeToVisibility,
    type ScorecardCriterionDimension,
    type ScorecardCriterion,
    type ScorecardDetail,
    type ScorecardListItem,
    type ScorecardStep,
} from "@/features/scorecards/domain";

export interface ScorecardRow {
    category?: string | null;
    created_at?: string | null;
    description?: string | null;
    domain?: string | null;
    id: string;
    is_active?: boolean | null;
    level?: string | null;
    method_id: string;
    method_name?: string | null;
    name: string;
    organization_id?: string | null;
    status?: string | null;
    visibility_scope?: string | null;
}

export interface ScorecardStepRow {
    id: string;
    method_step_id: string;
    name: string;
    scorecard_id: string;
    step_order: number;
}

export interface ScorecardCriterionRow {
    ai_instruction?: string | null;
    criterion_key: string;
    criterion_order: number;
    dimension: string;
    dimension_item_id?: string | null;
    expected_evidence: string;
    id: string;
    max_points?: number | null;
    scorecard_step_id: string;
    skill_id: string;
    verbatim?: string | null;
}

function normalizeDimension(value: string | null | undefined): ScorecardCriterionDimension {
    return SCORECARD_CRITERION_DIMENSIONS.includes(value as ScorecardCriterionDimension)
        ? (value as ScorecardCriterionDimension)
        : "savoir_faire";
}

export function mapScorecardRowToListItem(
    row: ScorecardRow,
    methodName = "",
    stepCount = 0,
    criteriaCount = 0,
): ScorecardListItem {
    return {
        category: row.category ?? "",
        criteriaCount,
        description: row.description ?? "",
        domain: row.domain ?? "",
        id: row.id,
        level: row.level ?? "",
        methodName: methodName || row.method_name || "",
        name: row.name,
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
        stepCount,
        visibility: scorecardScopeToVisibility(row.visibility_scope),
    };
}

function mapCriterionRow(row: ScorecardCriterionRow): ScorecardCriterion {
    return {
        aiInstruction: row.ai_instruction ?? "",
        competenceId: row.skill_id,
        dimension: normalizeDimension(row.dimension),
        dimensionItemId: row.dimension_item_id ?? null,
        expectedEvidence: row.expected_evidence,
        id: row.id,
        key: row.criterion_key,
        maxPoints: row.max_points ?? 1,
        order: row.criterion_order,
        verbatim: row.verbatim ?? "",
    };
}

function mapStepRow(row: ScorecardStepRow, criteria: ScorecardCriterion[] = []): ScorecardStep {
    return {
        criteria: criteria.slice().sort((first, second) => first.order - second.order),
        id: row.id,
        methodStepId: row.method_step_id,
        name: row.name,
        order: row.step_order,
    };
}

export function mapScorecardRowsToDetail(
    row: ScorecardRow,
    steps: ScorecardStepRow[],
    criteria: ScorecardCriterionRow[],
    methodName = "",
): ScorecardDetail {
    const criteriaByStepId = new Map<string, ScorecardCriterion[]>();
    for (const criterionRow of criteria) {
        const current = criteriaByStepId.get(criterionRow.scorecard_step_id) ?? [];
        current.push(mapCriterionRow(criterionRow));
        criteriaByStepId.set(criterionRow.scorecard_step_id, current);
    }

    const orderedSteps = steps
        .slice()
        .sort((first, second) => first.step_order - second.step_order)
        .map((step) => mapStepRow(step, criteriaByStepId.get(step.id) ?? []));

    return {
        ...mapScorecardRowToListItem(
            row,
            methodName,
            orderedSteps.length,
            orderedSteps.reduce((total, step) => total + step.criteria.length, 0),
        ),
        createdAt: row.created_at ?? null,
        methodId: row.method_id,
        organizationId: row.organization_id ?? null,
        steps: orderedSteps,
    };
}
