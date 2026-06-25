import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

const coachSelect = "id, name, voice_id, system_instructions, avatar_url, created_at, status";

export async function createCoach(input: SaveCoachDto): Promise<CoachListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await adminSupabase
        .from("coaches")
        .insert({
            avatar_url: input.avatarSrc || null,
            created_at: now,
            created_by: context.userId,
            name: input.name,
            status: PUBLISHED_CONTENT_STATUS,
            system_instructions: input.systemInstructions,
            updated_at: now,
            voice_id: input.voiceId,
        })
        .select(coachSelect)
        .single<CoachRow>();

    if (error) {
        throw error;
    }

    return mapCoachRowToListItem(data);
}
