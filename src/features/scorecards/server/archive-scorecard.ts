import { removeContent } from "@/features/content/server";

export async function removeScorecard(scorecardId: string) {
    return removeContent({
        archiveChanges: { is_active: false },
        dependencyChecks: [
            { column: "scorecard_id", table: "scenarios" },
            { column: "scorecard_id", table: "roleplay_session_results" },
            { column: "scorecard_id", table: "roleplay_session_step_results" },
            { column: "scorecard_id", table: "roleplay_session_criterion_results" },
        ],
        entityId: scorecardId,
        entityLabel: "Scorecard",
        table: "scorecards",
    });
}
