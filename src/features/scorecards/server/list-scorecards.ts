import { requireAuth } from "@/features/auth/server";
import type { ScorecardListItem } from "@/features/scorecards/domain";
import { createClient } from "@/lib/supabase/server";
import { mapScorecardRowToListItem, type ScorecardRow } from "./scorecard.mapper";
import { SCORECARD_SELECT } from "./scorecard.persistence";

async function getMethodNamesById(methodIds: string[]) {
    if (methodIds.length === 0) {
        return new Map<string, string>();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
        .from("methods")
        .select("id, name, code")
        .in("id", methodIds);

    if (error) {
        throw error;
    }

    return new Map(
        (data ?? []).flatMap((method: { code?: string | null; id?: string | null; name?: string | null }) =>
            method.id ? [[method.id, method.code || method.name || ""]] : [],
        ),
    );
}

export async function listScorecards(): Promise<ScorecardListItem[]> {
    await requireAuth();
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("scorecards")
        .select(SCORECARD_SELECT)
        .neq("status", "archived")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    const scorecards = (data ?? []) as ScorecardRow[];
    const scorecardIds = scorecards.map((scorecard) => scorecard.id);
    const methodNamesById = await getMethodNamesById(Array.from(new Set(scorecards.map((scorecard) => scorecard.method_id))));
    const stepCountByScorecardId = new Map<string, number>();
    const criteriaCountByScorecardId = new Map<string, number>();

    if (scorecardIds.length > 0) {
        const { data: stepRows, error: stepsError } = await supabase
            .from("scorecard_steps")
            .select("id, scorecard_id")
            .in("scorecard_id", scorecardIds);

        if (stepsError) {
            throw stepsError;
        }

        const stepIds: string[] = [];
        const scorecardIdByStepId = new Map<string, string>();

        for (const row of stepRows ?? []) {
            const step = row as { id?: string | null; scorecard_id?: string | null };
            if (!step.id || !step.scorecard_id) continue;

            stepIds.push(step.id);
            scorecardIdByStepId.set(step.id, step.scorecard_id);
            stepCountByScorecardId.set(
                step.scorecard_id,
                (stepCountByScorecardId.get(step.scorecard_id) ?? 0) + 1,
            );
        }

        if (stepIds.length > 0) {
            const { data: criterionRows, error: criteriaError } = await supabase
                .from("scorecard_criteria")
                .select("scorecard_step_id")
                .in("scorecard_step_id", stepIds);

            if (criteriaError) {
                throw criteriaError;
            }

            for (const row of criterionRows ?? []) {
                const stepId = (row as { scorecard_step_id?: string | null }).scorecard_step_id;
                if (!stepId) continue;

                const scorecardId = scorecardIdByStepId.get(stepId);
                if (!scorecardId) continue;

                criteriaCountByScorecardId.set(
                    scorecardId,
                    (criteriaCountByScorecardId.get(scorecardId) ?? 0) + 1,
                );
            }
        }
    }

    return scorecards.map((scorecard) =>
        mapScorecardRowToListItem(
            scorecard,
            methodNamesById.get(scorecard.method_id) ?? "",
            stepCountByScorecardId.get(scorecard.id) ?? 0,
            criteriaCountByScorecardId.get(scorecard.id) ?? 0,
        ),
    );
}
