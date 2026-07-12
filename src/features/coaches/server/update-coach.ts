import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";

export async function updateCoach(
    coachId: string,
    input: SaveCoachDto,
    backgroundFile: File | null = null,
): Promise<CoachListItem> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data: existingCoach, error: existingCoachError } = await adminSupabase
        .from("coaches")
        .select("background_image_path")
        .eq("id", coachId)
        .maybeSingle<{ background_image_path: string | null }>();

    if (existingCoachError) throw existingCoachError;
    if (!existingCoach) throw new NotFoundError("Coach introuvable.");
    if (!backgroundFile && input.backgroundImagePath && input.backgroundImagePath !== existingCoach.background_image_path) {
        throw new AppError(
            "Le fond de session sélectionné n'appartient pas à ce coach.",
            400,
            "COACH_BACKGROUND_INVALID",
        );
    }

    const uploadedBackground = backgroundFile
        ? await uploadSessionBackground(adminSupabase, SESSION_BACKGROUND_OWNER.coach, coachId, backgroundFile)
        : null;
    const nextBackgroundPath = uploadedBackground?.path ?? (input.backgroundImagePath || null);
    const { data, error } = await adminSupabase
        .from("coaches")
        .update({
            avatar_url: input.avatarSrc || null,
            background_image_path: nextBackgroundPath,
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
        if (uploadedBackground) {
            await removeSessionBackground(adminSupabase, uploadedBackground.path).catch(() => undefined);
        }
        throw error;
    }

    if (!data) {
        if (uploadedBackground) {
            await removeSessionBackground(adminSupabase, uploadedBackground.path).catch(() => undefined);
        }
        throw new NotFoundError("Coach introuvable.");
    }

    if (existingCoach.background_image_path && existingCoach.background_image_path !== nextBackgroundPath) {
        await removeSessionBackground(adminSupabase, existingCoach.background_image_path).catch((cleanupError) => {
            console.error("Unable to remove previous coach background:", cleanupError);
        });
    }

    return mapCoachRowToListItem(data);
}
