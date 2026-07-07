import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

export async function createCoach(input: SaveCoachDto): Promise<CoachListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await adminSupabase
        .from("coaches")
        .insert({
            avatar_url: input.avatarSrc || null,
            certifications: input.certifications || null,
            coaching_style: input.coachingStyle || null,
            created_at: now,
            created_by: context.userId,
            diploma: input.diploma || null,
            disc_profile: input.discProfile || null,
            expertise_domain: input.expertiseDomain || null,
            name: input.name,
            status: PUBLISHED_CONTENT_STATUS,
            system_instructions: input.systemInstructions,
            updated_at: now,
            voice_id: input.voiceId,
        })
        .select(COACH_SELECT)
        .single<CoachRow>();

    if (error) {
        throw error;
    }

    return mapCoachRowToListItem(data);
}
