import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/features/auth/server";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { mapDatabaseError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchScorecardDetail } from "./scorecard-query";
import {
    createScorecardCriterionRows,
    createScorecardStepRows,
    createScorecardUpdate,
} from "./scorecard.persistence";
import { assertScorecardLifecycle } from "./assert-scorecard-lifecycle";

export async function updateScorecard(
    scorecardId: string,
    input: SaveScorecardDto,
): Promise<ScorecardDetail> {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data: existing, error: existingError } = await adminSupabase
        .from("scorecards")
        .select("status")
        .eq("id", scorecardId)
        .maybeSingle<{ status: SaveScorecardDto["status"] }>();

    if (existingError) throw existingError;
    if (!existing) throw new NotFoundError("Scorecard introuvable.");

    await assertScorecardLifecycle(adminSupabase, input, existing.status);

    const scorecardStepIdsByMethodStepId = new Map(
        input.steps.map((step) => [step.methodStepId, step.id ?? randomUUID()]),
    );
    const steps = createScorecardStepRows(scorecardId, input).map((row) => ({
        ...row,
        id: scorecardStepIdsByMethodStepId.get(row.method_step_id),
    }));
    const criterionIds = input.steps.flatMap((step) =>
        step.criteria.map((criterion) => criterion.id ?? randomUUID())
    );
    const criteria = createScorecardCriterionRows(input, scorecardStepIdsByMethodStepId)
        .map((row, index) => ({ ...row, id: criterionIds[index] ?? randomUUID() }));
    const { error } = await adminSupabase.rpc("admin_update_scorecard_aggregate", {
        p_criteria: criteria,
        p_scorecard: createScorecardUpdate(input),
        p_scorecard_id: scorecardId,
        p_steps: steps,
    });

    if (error) throw mapDatabaseError(error);

    return fetchScorecardDetail(adminSupabase, scorecardId);
}
