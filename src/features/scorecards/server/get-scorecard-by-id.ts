import { requireAuth } from "@/features/auth/server";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import { createClient } from "@/lib/supabase/server";
import { fetchScorecardDetail } from "./scorecard-query";

export async function getScorecardById(scorecardId: string): Promise<ScorecardDetail> {
    await requireAuth();
    const supabase = await createClient();

    return fetchScorecardDetail(supabase, scorecardId);
}
