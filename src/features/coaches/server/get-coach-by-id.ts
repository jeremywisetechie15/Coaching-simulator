import { requireAdmin, requireAuth } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { CoachDetail, CoachEditorValues } from "@/features/coaches/domain/coach-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACH_SELECT, mapCoachRowToDetail, mapCoachRowToEditorValues, type CoachRow } from "./coach.mapper";

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

export async function getCoachDetailById(coachId: string): Promise<CoachDetail | null> {
    const context = await requireAuth();
    const adminSupabase = createAdminClient();
    let query = adminSupabase
        .from("coaches")
        .select(COACH_SELECT)
        .eq("id", coachId);

    if (context.platformRole !== "admin") {
        query = query.eq("status", CONTENT_STATUS.published);
    }

    const { data, error } = await query.maybeSingle<CoachRow>();

    if (error) throw error;
    return data ? mapCoachRowToDetail(data) : null;
}
