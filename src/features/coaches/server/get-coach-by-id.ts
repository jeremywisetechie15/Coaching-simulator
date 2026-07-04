import { requireAdmin } from "@/features/auth/server";
import type { CoachEditorValues } from "@/features/coaches/domain/coach-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACH_SELECT, mapCoachRowToEditorValues, type CoachRow } from "./coach.mapper";

export async function getCoachById(coachId: string): Promise<CoachEditorValues | null> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("coaches")
        .select(COACH_SELECT)
        .eq("id", coachId)
        .maybeSingle<CoachRow>();

    if (error) {
        throw error;
    }

    return data ? mapCoachRowToEditorValues(data) : null;
}
