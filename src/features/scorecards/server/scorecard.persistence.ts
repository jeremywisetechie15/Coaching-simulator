import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { CONTENT_STATUS } from "@/features/content/domain";
import { scorecardVisibilityToScope } from "@/features/scorecards/domain";

export const SCORECARD_SELECT =
    "id, name, description, domain, category, level, method_id, visibility_scope, organization_id, status, is_active, created_at";

export const SCORECARD_STEP_SELECT =
    "id, scorecard_id, method_step_id, step_order, name";

export const SCORECARD_CRITERION_SELECT =
    "id, scorecard_step_id, criterion_order, criterion_key, expected_evidence, skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim";

export function nullableText(value: string | null | undefined) {
    const trimmed = value?.trim() ?? "";
    return trimmed.length > 0 ? trimmed : null;
}

function createScorecardBasePayload(input: SaveScorecardDto) {
    const visibilityScope = scorecardVisibilityToScope(input.visibility);

    return {
        category: nullableText(input.category),
        description: nullableText(input.description),
        domain: nullableText(input.domain),
        is_active: input.status !== "archived",
        level: nullableText(input.level),
        method_id: input.methodId,
        name: input.name,
        organization_id: visibilityScope === "organization" ? input.organizationId : null,
        status: input.status,
        updated_at: new Date().toISOString(),
        visibility_scope: visibilityScope,
    };
}

export function createScorecardInsert(input: SaveScorecardDto, createdBy: string) {
    const now = new Date().toISOString();

    return {
        ...createScorecardBasePayload(input),
        created_at: now,
        created_by: createdBy,
        updated_at: now,
    };
}

export function createScorecardUpdate(input: SaveScorecardDto) {
    return createScorecardBasePayload(input);
}

export function createScorecardStepRows(scorecardId: string, input: SaveScorecardDto) {
    return input.steps.map((step, index) => ({
        method_step_id: step.methodStepId,
        name: step.name,
        scorecard_id: scorecardId,
        step_order: step.order || index + 1,
    }));
}

export function createScorecardCriterionRows(
    input: SaveScorecardDto,
    scorecardStepIdsByMethodStepId: Map<string, string>,
) {
    return input.steps.flatMap((step) => {
        const scorecardStepId = scorecardStepIdsByMethodStepId.get(step.methodStepId);
        if (!scorecardStepId) return [];

        return step.criteria.map((criterion, index) => ({
            ai_instruction: nullableText(criterion.aiInstruction),
            criterion_key: criterion.key,
            criterion_order: criterion.order || index + 1,
            dimension: criterion.dimension,
            dimension_item_id: criterion.dimensionItemId,
            expected_evidence: criterion.expectedEvidence,
            max_points: criterion.maxPoints,
            scorecard_step_id: scorecardStepId,
            skill_id: criterion.competenceId,
            verbatim: nullableText(criterion.verbatim),
        }));
    });
}

interface DuplicateScorecardSource {
    category?: string | null;
    description?: string | null;
    domain?: string | null;
    level?: string | null;
    method_id: string;
    name: string;
    organization_id?: string | null;
    visibility_scope?: string | null;
}

interface DuplicateScorecardStepSource {
    id: string;
    method_step_id: string;
    name: string;
    scorecard_id?: string | null;
    step_order: number;
}

interface DuplicateScorecardCriterionSource {
    ai_instruction?: string | null;
    criterion_key: string;
    criterion_order: number;
    dimension: string;
    dimension_item_id?: string | null;
    expected_evidence: string;
    id?: string;
    max_points?: number | null;
    scorecard_step_id: string;
    skill_id: string;
    verbatim?: string | null;
}

export function createDuplicateScorecardInsert(source: DuplicateScorecardSource, createdBy: string) {
    const now = new Date().toISOString();
    const visibilityScope = source.visibility_scope === "organization" ? "organization" : "public";

    return {
        category: source.category ?? null,
        created_at: now,
        created_by: createdBy,
        description: source.description ?? null,
        domain: source.domain ?? null,
        is_active: true,
        level: source.level ?? null,
        method_id: source.method_id,
        name: `Copie de ${source.name}`,
        organization_id: visibilityScope === "organization" ? source.organization_id ?? null : null,
        status: CONTENT_STATUS.draft,
        updated_at: now,
        visibility_scope: visibilityScope,
    };
}

export function createDuplicateScorecardStepRows(
    scorecardId: string,
    sourceSteps: DuplicateScorecardStepSource[],
) {
    return sourceSteps.map((step) => ({
        method_step_id: step.method_step_id,
        name: step.name,
        scorecard_id: scorecardId,
        step_order: step.step_order,
    }));
}

export function createDuplicateScorecardCriterionRows(
    sourceCriteria: DuplicateScorecardCriterionSource[],
    scorecardStepIdsBySourceStepId: Map<string, string>,
) {
    return sourceCriteria.flatMap((criterion) => {
        const scorecardStepId = scorecardStepIdsBySourceStepId.get(criterion.scorecard_step_id);
        if (!scorecardStepId) return [];

        return {
            ai_instruction: criterion.ai_instruction ?? null,
            criterion_key: criterion.criterion_key,
            criterion_order: criterion.criterion_order,
            dimension: criterion.dimension,
            dimension_item_id: criterion.dimension_item_id ?? null,
            expected_evidence: criterion.expected_evidence,
            max_points: criterion.max_points ?? 1,
            scorecard_step_id: scorecardStepId,
            skill_id: criterion.skill_id,
            verbatim: criterion.verbatim ?? null,
        };
    });
}
