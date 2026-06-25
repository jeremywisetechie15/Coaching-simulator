import { requireAuth } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { CONTENT_STATUS } from "@/features/content/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

export async function listCoaches(): Promise<CoachListItem[]> {
    const context = await requireAuth();

    const adminSupabase = createAdminClient();
    let query = adminSupabase
        .from("coaches")
        .select("id, name, voice_id, system_instructions, avatar_url, created_at, status")
        .order("created_at", { ascending: false });

    if (context.platformRole !== "admin") {
        query = query.eq("status", CONTENT_STATUS.published);
    }

    const { data, error } = await query.returns<CoachRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapCoachRowToListItem);
}
