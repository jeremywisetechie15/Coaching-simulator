import type { SupabaseClient } from "@supabase/supabase-js";
import { hasRoleplaySessionsForScenarioDependency } from "@/features/content/server";
import {
    hasScorecardUsageLockedConfigurationChanged,
    SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE,
    type ScorecardDetail,
    type ScorecardUsageLockedConfiguration,
} from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { ConflictError } from "@/lib/server/errors";
import { fetchScorecardDetail } from "./scorecard-query";

function nullableText(value: string | null | undefined) {
    const normalized = value?.trim() ?? "";
    return normalized ? normalized : null;
}

function currentConfiguration(
    scorecard: ScorecardDetail,
): ScorecardUsageLockedConfiguration {
    return {
        category: nullableText(scorecard.category),
        domain: nullableText(scorecard.domain),
        level: nullableText(scorecard.level),
        methodId: scorecard.methodId,
        organizationId:
            scorecard.visibility === "private" ? scorecard.organizationId : null,
        steps: scorecard.steps.map((step) => ({
            criteria: step.criteria.map((criterion) => ({
                competenceId: nullableText(criterion.competenceId),
                dimension: criterion.dimension,
                dimensionItemId: criterion.dimensionItemId,
                id: criterion.id,
            })),
            id: step.id,
            methodStepId: step.methodStepId,
            order: step.order,
        })),
        visibility: scorecard.visibility,
    };
}

function nextConfiguration(
    input: SaveScorecardDto,
): ScorecardUsageLockedConfiguration {
    return {
        category: nullableText(input.category),
        domain: nullableText(input.domain),
        level: nullableText(input.level),
        methodId: input.methodId,
        organizationId: input.visibility === "private" ? input.organizationId : null,
        steps: input.steps.map((step) => ({
            criteria: step.criteria.map((criterion) => ({
                competenceId: nullableText(criterion.competenceId),
                dimension: criterion.dimension,
                dimensionItemId: criterion.dimensionItemId,
                id: criterion.id ?? null,
            })),
            id: step.id ?? null,
            methodStepId: step.methodStepId,
            order: step.order,
        })),
        visibility: input.visibility,
    };
}

async function hasScorecardResults(
    supabase: SupabaseClient,
    scorecardId: string,
) {
    const { count, error } = await supabase
        .from("roleplay_session_results")
        .select("id", { count: "exact", head: true })
        .eq("scorecard_id", scorecardId);

    if (error) throw error;

    return (count ?? 0) > 0;
}

export async function hasScorecardUsage(
    supabase: SupabaseClient,
    scorecardId: string,
) {
    const [hasSessions, hasResults] = await Promise.all([
        hasRoleplaySessionsForScenarioDependency(supabase, "scorecard_id", scorecardId),
        hasScorecardResults(supabase, scorecardId),
    ]);

    return hasSessions || hasResults;
}

export async function assertScorecardUsageEditPolicy(
    supabase: SupabaseClient,
    scorecardId: string,
    input: SaveScorecardDto,
) {
    if (!(await hasScorecardUsage(supabase, scorecardId))) return;

    const currentScorecard = await fetchScorecardDetail(supabase, scorecardId);
    if (
        hasScorecardUsageLockedConfigurationChanged(
            currentConfiguration(currentScorecard),
            nextConfiguration(input),
        )
    ) {
        throw new ConflictError(SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE);
    }
}
