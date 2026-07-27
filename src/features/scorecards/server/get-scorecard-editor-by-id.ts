import { requireAdmin } from "@/features/auth/server";
import type { ScorecardEditorDetail } from "@/features/scorecards/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchScorecardDetail } from "./scorecard-query";
import { hasScorecardUsage } from "./scorecard-usage-edit-policy";

export async function getScorecardEditorById(
    scorecardId: string,
): Promise<ScorecardEditorDetail> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const [scorecard, hasUsage] = await Promise.all([
        fetchScorecardDetail(adminSupabase, scorecardId),
        hasScorecardUsage(adminSupabase, scorecardId),
    ]);

    return {
        ...scorecard,
        hasUsage,
    };
}
