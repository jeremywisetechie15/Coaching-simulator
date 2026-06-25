import { requireAdmin } from "@/features/auth/server";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScorecardRow } from "./scorecard.mapper";
import { fetchScorecardDetail } from "./scorecard-query";
import { createScorecardUpdate, SCORECARD_SELECT } from "./scorecard.persistence";
import { replaceScorecardChildren } from "./save-scorecard-children";

export async function updateScorecard(
    scorecardId: string,
    input: SaveScorecardDto,
): Promise<ScorecardDetail> {
    await requireAdmin();
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
        .from("scorecards")
        .update(createScorecardUpdate(input))
        .eq("id", scorecardId)
        .select(SCORECARD_SELECT)
        .maybeSingle<ScorecardRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Scorecard introuvable.");
    }

    await replaceScorecardChildren(adminSupabase, scorecardId, input);

    return fetchScorecardDetail(adminSupabase, scorecardId);
}
