import { requireAdmin } from "@/features/auth/server";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import type { SaveScorecardDto } from "@/features/scorecards/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScorecardRow } from "./scorecard.mapper";
import { fetchScorecardDetail } from "./scorecard-query";
import { createScorecardInsert, SCORECARD_SELECT } from "./scorecard.persistence";
import { replaceScorecardChildren } from "./save-scorecard-children";

export async function createScorecard(input: SaveScorecardDto): Promise<ScorecardDetail> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    let createdScorecardId: string | null = null;

    try {
        const { data: scorecardRow, error } = await adminSupabase
            .from("scorecards")
            .insert(createScorecardInsert(input, context.userId))
            .select(SCORECARD_SELECT)
            .single<ScorecardRow>();

        if (error) {
            throw error;
        }

        createdScorecardId = scorecardRow.id;
        await replaceScorecardChildren(adminSupabase, scorecardRow.id, input);

        return fetchScorecardDetail(adminSupabase, scorecardRow.id);
    } catch (error) {
        if (createdScorecardId) {
            await adminSupabase.from("scorecards").delete().eq("id", createdScorecardId);
        }

        throw error;
    }
}
