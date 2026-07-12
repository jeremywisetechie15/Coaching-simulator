import { requireAdmin } from "@/features/auth/server";
import { resolveDuplicateName } from "@/features/content/server";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScorecardCriterionRow, ScorecardRow, ScorecardStepRow } from "./scorecard.mapper";
import { fetchScorecardDetail } from "./scorecard-query";
import {
    createDuplicateScorecardCriterionRows,
    createDuplicateScorecardInsert,
    createDuplicateScorecardStepRows,
    SCORECARD_CRITERION_SELECT,
    SCORECARD_SELECT,
    SCORECARD_STEP_SELECT,
} from "./scorecard.persistence";

export async function duplicateScorecard(scorecardId: string): Promise<ScorecardDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    let duplicatedScorecardId: string | null = null;

    try {
        const { data: sourceScorecard, error: sourceError } = await adminSupabase
            .from("scorecards")
            .select(SCORECARD_SELECT)
            .eq("id", scorecardId)
            .maybeSingle<ScorecardRow>();

        if (sourceError) {
            throw sourceError;
        }

        if (!sourceScorecard) {
            throw new NotFoundError("Scorecard introuvable.");
        }

        const duplicateName = await resolveDuplicateName(adminSupabase, {
            column: "name",
            maxLength: 180,
            sourceName: sourceScorecard.name,
            table: "scorecards",
        });

        const { data: duplicatedScorecard, error: insertError } = await adminSupabase
            .from("scorecards")
            .insert(createDuplicateScorecardInsert(sourceScorecard, context.userId, duplicateName))
            .select(SCORECARD_SELECT)
            .single<ScorecardRow>();

        if (insertError) {
            throw insertError;
        }

        duplicatedScorecardId = duplicatedScorecard.id;

        const { data: sourceSteps, error: sourceStepsError } = await adminSupabase
            .from("scorecard_steps")
            .select(SCORECARD_STEP_SELECT)
            .eq("scorecard_id", scorecardId)
            .order("step_order", { ascending: true });

        if (sourceStepsError) {
            throw sourceStepsError;
        }

        const steps = (sourceSteps ?? []) as ScorecardStepRow[];
        if (steps.length === 0) {
            return fetchScorecardDetail(adminSupabase, duplicatedScorecardId);
        }

        const { data: duplicatedSteps, error: duplicatedStepsError } = await adminSupabase
            .from("scorecard_steps")
            .insert(createDuplicateScorecardStepRows(duplicatedScorecardId, steps))
            .select(SCORECARD_STEP_SELECT)
            .order("step_order", { ascending: true });

        if (duplicatedStepsError) {
            throw duplicatedStepsError;
        }

        const duplicatedStepIdsBySourceStepId = new Map<string, string>();
        const duplicatedStepsByMethodStepId = new Map(
            ((duplicatedSteps ?? []) as ScorecardStepRow[]).map((step) => [step.method_step_id, step.id]),
        );

        for (const step of steps) {
            const duplicatedStepId = duplicatedStepsByMethodStepId.get(step.method_step_id);
            if (duplicatedStepId) {
                duplicatedStepIdsBySourceStepId.set(step.id, duplicatedStepId);
            }
        }

        const { data: sourceCriteria, error: sourceCriteriaError } = await adminSupabase
            .from("scorecard_criteria")
            .select(SCORECARD_CRITERION_SELECT)
            .in(
                "scorecard_step_id",
                steps.map((step) => step.id),
            )
            .order("criterion_order", { ascending: true });

        if (sourceCriteriaError) {
            throw sourceCriteriaError;
        }

        const criterionRows = createDuplicateScorecardCriterionRows(
            (sourceCriteria ?? []) as ScorecardCriterionRow[],
            duplicatedStepIdsBySourceStepId,
        );

        if (criterionRows.length > 0) {
            const { error: duplicatedCriteriaError } = await adminSupabase
                .from("scorecard_criteria")
                .insert(criterionRows);

            if (duplicatedCriteriaError) {
                throw duplicatedCriteriaError;
            }
        }

        return fetchScorecardDetail(adminSupabase, duplicatedScorecardId);
    } catch (error) {
        if (duplicatedScorecardId) {
            await adminSupabase.from("scorecards").delete().eq("id", duplicatedScorecardId);
        }

        throw error;
    }
}
