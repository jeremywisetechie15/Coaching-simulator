import type { SupabaseClient } from "@supabase/supabase-js";

export type RoleplayScorecardDimension = "savoir" | "savoir_faire" | "savoir_etre";

interface ScorecardRow {
    category: string | null;
    description: string | null;
    domain: string | null;
    id: string;
    level: string | null;
    method_id: string;
    name: string;
}

interface ScorecardStepRow {
    id: string;
    method_step_id: string | null;
    name: string | null;
    step_order: number;
    weight_percent: number | string;
}

interface ScorecardCriterionRow {
    ai_instruction: string | null;
    criterion_key: string | null;
    criterion_order: number;
    dimension: string;
    dimension_item_id: string | null;
    expected_evidence: string | null;
    id: string;
    max_points: number | null;
    scorecard_step_id: string;
    skill_id: string;
    verbatim: string | null;
}

interface SkillRow {
    id: string;
    name: string | null;
}

interface DimensionItemRow {
    id: string;
    label: string | null;
}

export interface RoleplayScorecardCriterionDefinition {
    aiInstruction: string;
    criterionKey: string;
    dimension: RoleplayScorecardDimension;
    dimensionItemId: string | null;
    dimensionItemLabel: string | null;
    expectedEvidence: string;
    id: string;
    maxPoints: number;
    order: number;
    skillId: string;
    skillName: string;
    verbatim: string;
}

export interface RoleplayScorecardDefinition {
    category: string;
    description: string;
    domain: string;
    id: string;
    level: string;
    methodId: string;
    name: string;
    steps: Array<{
        criteria: RoleplayScorecardCriterionDefinition[];
        id: string;
        methodStepId: string | null;
        order: number;
        title: string;
        weightPercent: number;
    }>;
}

function cleanText(value: string | null | undefined) {
    return value?.trim() ?? "";
}

function normalizeDimension(value: string): RoleplayScorecardDimension {
    if (value === "savoir" || value === "savoir_faire" || value === "savoir_etre") {
        return value;
    }

    return "savoir_faire";
}

export async function getRoleplayScorecardDefinition(
    supabase: SupabaseClient,
    scorecardId: string | null,
    methodStepId?: string,
): Promise<RoleplayScorecardDefinition | null> {
    if (!scorecardId) return null;

    let scorecardStepsQuery = supabase
        .from("scorecard_steps")
        .select("id, method_step_id, step_order, name, weight_percent")
        .eq("scorecard_id", scorecardId);

    if (methodStepId) {
        scorecardStepsQuery = scorecardStepsQuery.eq("method_step_id", methodStepId);
    }

    const [scorecardResult, scorecardStepsResult] = await Promise.all([
        supabase
            .from("scorecards")
            .select("id, name, description, domain, category, level, method_id")
            .eq("id", scorecardId)
            .maybeSingle<ScorecardRow>(),
        scorecardStepsQuery
            .order("step_order", { ascending: true })
            .returns<ScorecardStepRow[]>(),
    ]);

    if (scorecardResult.error) throw scorecardResult.error;
    if (scorecardStepsResult.error) throw scorecardStepsResult.error;
    if (!scorecardResult.data) return null;

    const scorecard = scorecardResult.data;
    const steps = scorecardStepsResult.data ?? [];
    if (steps.length === 0) {
        return {
            category: cleanText(scorecard.category),
            description: cleanText(scorecard.description),
            domain: cleanText(scorecard.domain),
            id: scorecard.id,
            level: cleanText(scorecard.level),
            methodId: scorecard.method_id,
            name: scorecard.name,
            steps: [],
        };
    }

    const { data: criteria, error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .select("id, scorecard_step_id, criterion_order, criterion_key, expected_evidence, skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim")
        .in("scorecard_step_id", steps.map((step) => step.id))
        .order("criterion_order", { ascending: true })
        .returns<ScorecardCriterionRow[]>();

    if (criteriaError) throw criteriaError;

    const criterionRows = criteria ?? [];
    const skillIds = [...new Set(criterionRows.map((criterion) => criterion.skill_id).filter(Boolean))];
    const dimensionItemIds = [...new Set(
        criterionRows
            .map((criterion) => criterion.dimension_item_id)
            .filter((id): id is string => Boolean(id)),
    )];

    const [skillsResult, dimensionItemsResult] = await Promise.all([
        skillIds.length > 0
            ? supabase
                .from("skills")
                .select("id, name")
                .in("id", skillIds)
                .returns<SkillRow[]>()
            : Promise.resolve({ data: [] as SkillRow[], error: null }),
        dimensionItemIds.length > 0
            ? supabase
                .from("skill_dimension_items")
                .select("id, label")
                .in("id", dimensionItemIds)
                .returns<DimensionItemRow[]>()
            : Promise.resolve({ data: [] as DimensionItemRow[], error: null }),
    ]);

    if (skillsResult.error) throw skillsResult.error;
    if (dimensionItemsResult.error) throw dimensionItemsResult.error;

    const skillsById = new Map((skillsResult.data ?? []).map((skill) => [skill.id, skill]));
    const dimensionItemsById = new Map(
        (dimensionItemsResult.data ?? []).map((item) => [item.id, item]),
    );
    const criteriaByStepId = new Map<string, ScorecardCriterionRow[]>();

    for (const criterion of criterionRows) {
        const stepCriteria = criteriaByStepId.get(criterion.scorecard_step_id) ?? [];
        stepCriteria.push(criterion);
        criteriaByStepId.set(criterion.scorecard_step_id, stepCriteria);
    }

    return {
        category: cleanText(scorecard.category),
        description: cleanText(scorecard.description),
        domain: cleanText(scorecard.domain),
        id: scorecard.id,
        level: cleanText(scorecard.level),
        methodId: scorecard.method_id,
        name: scorecard.name,
        steps: steps.map((step) => ({
            criteria: (criteriaByStepId.get(step.id) ?? [])
                .sort((left, right) => left.criterion_order - right.criterion_order)
                .map((criterion) => ({
                    aiInstruction: cleanText(criterion.ai_instruction),
                    criterionKey: cleanText(criterion.criterion_key),
                    dimension: normalizeDimension(criterion.dimension),
                    dimensionItemId: criterion.dimension_item_id,
                    dimensionItemLabel: criterion.dimension_item_id
                        ? cleanText(dimensionItemsById.get(criterion.dimension_item_id)?.label) || null
                        : null,
                    expectedEvidence: cleanText(criterion.expected_evidence),
                    id: criterion.id,
                    maxPoints: Math.max(1, Number(criterion.max_points) || 1),
                    order: criterion.criterion_order,
                    skillId: criterion.skill_id,
                    skillName: cleanText(skillsById.get(criterion.skill_id)?.name) || criterion.skill_id,
                    verbatim: cleanText(criterion.verbatim),
                })),
            id: step.id,
            methodStepId: step.method_step_id,
            order: step.step_order,
            title: cleanText(step.name) || `Étape ${step.step_order}`,
            weightPercent: Number(step.weight_percent),
        })),
    };
}
