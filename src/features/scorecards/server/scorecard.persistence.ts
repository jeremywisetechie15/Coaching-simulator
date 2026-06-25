import type { SaveScorecardDto } from "@/features/scorecards/dto";
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
