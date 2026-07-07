import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import { NotFoundError } from "@/lib/server/errors";
import {
    mapScorecardRowsToDetail,
    type ScorecardCriterionRow,
    type ScorecardRow,
    type ScorecardStepRow,
} from "./scorecard.mapper";
import {
    SCORECARD_CRITERION_SELECT,
    SCORECARD_SELECT,
    SCORECARD_STEP_SELECT,
} from "./scorecard.persistence";

async function getMethodNameById(supabase: SupabaseClient, methodId: string) {
    const { data, error } = await supabase
        .from("methods")
        .select("id, name, code")
        .eq("id", methodId)
        .maybeSingle<{ code?: string | null; id: string; name?: string | null }>();

    if (error) {
        throw error;
    }

    return data?.code || data?.name || "";
}

export async function fetchScorecardDetail(
    supabase: SupabaseClient,
    scorecardId: string,
): Promise<ScorecardDetail> {
    const { data: scorecardRow, error } = await supabase
        .from("scorecards")
        .select(SCORECARD_SELECT)
        .eq("id", scorecardId)
        .maybeSingle<ScorecardRow>();

    if (error) {
        throw error;
    }

    if (!scorecardRow) {
        throw new NotFoundError("Scorecard introuvable.");
    }

    const [{ data: stepRows, error: stepsError }, methodName] = await Promise.all([
        supabase
            .from("scorecard_steps")
            .select(SCORECARD_STEP_SELECT)
            .eq("scorecard_id", scorecardId)
            .order("step_order", { ascending: true }),
        getMethodNameById(supabase, scorecardRow.method_id),
    ]);

    if (stepsError) {
        throw stepsError;
    }

    const steps = (stepRows ?? []) as ScorecardStepRow[];
    const stepIds = steps.map((step) => step.id);
    let criteria: ScorecardCriterionRow[] = [];

    if (stepIds.length > 0) {
        const { data, error: criteriaError } = await supabase
            .from("scorecard_criteria")
            .select(SCORECARD_CRITERION_SELECT)
            .in("scorecard_step_id", stepIds)
            .order("criterion_order", { ascending: true });

        if (criteriaError) {
            throw criteriaError;
        }

        criteria = (data ?? []) as ScorecardCriterionRow[];
    }

    return mapScorecardRowsToDetail(scorecardRow, steps, criteria, methodName);
}
