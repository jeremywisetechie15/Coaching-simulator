import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { AppError } from "@/lib/server/errors";
import type { ScorecardStepRow } from "./scorecard.mapper";
import {
    createScorecardCriterionRows,
    createScorecardStepRows,
    SCORECARD_STEP_SELECT,
} from "./scorecard.persistence";

async function assertMethodStepsBelongToMethod(supabase: SupabaseClient, input: SaveScorecardDto) {
    const methodStepIds = Array.from(new Set(input.steps.map((step) => step.methodStepId)));
    if (methodStepIds.length === 0) {
        return;
    }

    const { data, error } = await supabase
        .from("method_steps")
        .select("id")
        .eq("method_id", input.methodId)
        .in("id", methodStepIds);

    if (error) {
        throw error;
    }

    const validMethodStepIds = new Set((data ?? []).map((row: { id?: string | null }) => row.id).filter(Boolean));
    const invalidStepId = methodStepIds.find((methodStepId) => !validMethodStepIds.has(methodStepId));

    if (invalidStepId) {
        throw new AppError(
            "Une étape ne correspond pas à la méthode sélectionnée.",
            400,
            "SCORECARD_METHOD_STEP_MISMATCH",
        );
    }
}

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
