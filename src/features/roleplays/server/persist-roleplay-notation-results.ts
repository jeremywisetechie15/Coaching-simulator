import type { SupabaseClient } from "@supabase/supabase-js";
import {
    ROLEPLAY_NOTATION_SOURCE,
    type RoleplayNotationCriterionRef,
    type RoleplayNotationScoreResult,
} from "@/features/roleplays/domain";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

export async function persistRoleplayScorecardNotationResults(
    supabase: SupabaseClient,
    context: RoleplayScorecardNotationContext,
    result: RoleplayNotationScoreResult,
) {
    const refsByRef = new Map<string, RoleplayNotationCriterionRef>(
        context.criterionRefs.map((criterionRef) => [criterionRef.ref, criterionRef]),
    );
    const sessionId = context.session.id;

    const { error: deleteCriteriaError } = await supabase
        .from("roleplay_session_criterion_results")
        .delete()
        .eq("session_id", sessionId);

    if (deleteCriteriaError) throw deleteCriteriaError;

    const { error: deleteStepsError } = await supabase
        .from("roleplay_session_step_results")
        .delete()
        .eq("session_id", sessionId);

    if (deleteStepsError) throw deleteStepsError;

    const { error: upsertSessionError } = await supabase
        .from("roleplay_session_results")
        .upsert(
            {
                completed_at: context.session.completedAt,
                method_id: context.method.id,
                notation_source: ROLEPLAY_NOTATION_SOURCE.scorecard,
                points_awarded: round2(result.pointsAwarded),
                points_max: round2(result.pointsMax),
                scenario_id: context.session.scenarioId,
                score_percent: round2(result.globalScorePercent),
                scorecard_id: context.scorecard.id,
                session_id: sessionId,
                updated_at: new Date().toISOString(),
                user_id: context.session.userId,
            },
            { onConflict: "session_id" },
        );

    if (upsertSessionError) throw upsertSessionError;

    if (result.steps.length > 0) {
        const { error: insertStepsError } = await supabase
            .from("roleplay_session_step_results")
            .insert(
                result.steps.map((step) => ({
                    coach_comment: step.coachComment || null,
                    method_step_id: step.methodStepId,
                    points_awarded: round2(step.pointsAwarded),
                    points_max: round2(step.pointsMax),
                    scenario_id: context.session.scenarioId,
                    score_percent: round2(step.scorePercent),
                    scorecard_id: context.scorecard.id,
                    scorecard_step_id: step.scorecardStepId,
                    session_id: sessionId,
                    step_order: step.stepOrder,
                    title: step.title,
                    user_id: context.session.userId,
                })),
            );

        if (insertStepsError) throw insertStepsError;
    }

    if (result.criteria.length > 0) {
        const { error: insertCriteriaError } = await supabase
            .from("roleplay_session_criterion_results")
            .insert(
                result.criteria.flatMap((criterion) => {
                    const criterionRef = refsByRef.get(criterion.ref);
                    if (!criterionRef) return [];

                    return {
                        advice: criterion.advice || null,
                        coach_comment: criterion.coachComment || null,
                        criterion_ref: criterion.ref,
                        dimension: criterionRef.dimension,
                        dimension_item_id: criterionRef.dimensionItemId,
                        evidence: criterion.evidence || null,
                        points_awarded: round2(criterion.pointsAwarded),
                        points_max: round2(criterion.pointsMax),
                        scenario_id: context.session.scenarioId,
                        score_percent: round2(criterion.scorePercent),
                        scorecard_criterion_id: criterionRef.scorecardCriterionId,
                        scorecard_id: context.scorecard.id,
                        scorecard_step_id: criterionRef.scorecardStepId,
                        session_id: sessionId,
                        skill_id: criterionRef.skillId,
                        user_id: context.session.userId,
                    };
                }),
            );

        if (insertCriteriaError) throw insertCriteriaError;
    }
}
