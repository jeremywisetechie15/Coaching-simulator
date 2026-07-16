import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import type { ScorecardStepRow } from "./scorecard.mapper";
import {
    createScorecardCriterionRows,
    createScorecardStepRows,
    SCORECARD_STEP_SELECT,
} from "./scorecard.persistence";
import { assertMethodStepsBelongToMethod } from "./scorecard-method-steps.validation";

export async function replaceScorecardChildren(
    supabase: SupabaseClient,
    scorecardId: string,
    input: SaveScorecardDto,
) {
    await assertMethodStepsBelongToMethod(supabase, input);

    const { error: deleteError } = await supabase
        .from("scorecard_steps")
        .delete()
        .eq("scorecard_id", scorecardId);

    if (deleteError) {
        throw deleteError;
    }

    const stepRowsToInsert = createScorecardStepRows(scorecardId, input);
    if (stepRowsToInsert.length === 0) {
        return;
    }

    const { data: stepRows, error: stepsError } = await supabase
        .from("scorecard_steps")
        .insert(stepRowsToInsert)
        .select(SCORECARD_STEP_SELECT)
        .order("step_order", { ascending: true });

    if (stepsError) {
        throw stepsError;
    }

    const scorecardStepIdsByMethodStepId = new Map(
        ((stepRows ?? []) as ScorecardStepRow[]).map((step) => [step.method_step_id, step.id]),
    );
    const criterionRowsToInsert = createScorecardCriterionRows(input, scorecardStepIdsByMethodStepId);

    if (criterionRowsToInsert.length === 0) {
        return;
    }

    const { error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .insert(criterionRowsToInsert);

    if (criteriaError) {
        throw criteriaError;
    }
}
