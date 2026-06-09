import { requireAuth } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

export async function listCoaches(): Promise<CoachListItem[]> {
    await requireAuth();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("coaches")
        .select("id, name, voice_id, system_instructions, avatar_url, created_at")
        .order("created_at", { ascending: false })
        .returns<CoachRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapCoachRowToListItem);
}
