import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

export async function updateCoach(coachId: string, input: SaveCoachDto): Promise<CoachListItem> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("coaches")
        .update({
            avatar_url: input.avatarSrc || null,
            certifications: input.certifications || null,
            coaching_style: input.coachingStyle || null,
            diploma: input.diploma || null,
            disc_profile: input.discProfile || null,
            expertise_domain: input.expertiseDomain || null,
            name: input.name,
            system_instructions: input.systemInstructions,
            updated_at: new Date().toISOString(),
            voice_id: input.voiceId,
        })
        .eq("id", coachId)
        .select(COACH_SELECT)
        .maybeSingle<CoachRow>();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new NotFoundError("Coach introuvable.");
    }

    return mapCoachRowToListItem(data);
}
