import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { PUBLISHED_CONTENT_STATUS } from "@/features/content/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/server/errors";
import {
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";
import { createCoachInsert } from "./coach.persistence";

export async function createCoach(input: SaveCoachDto, backgroundFile: File | null = null): Promise<CoachListItem> {
    const context = await requireAdmin();
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();
    const coachId = crypto.randomUUID();

    if (!backgroundFile && input.backgroundImagePath) {
        throw new AppError(
            "Un fond existant ne peut pas être attribué à un nouveau coach.",
            400,
            "COACH_BACKGROUND_INVALID",
        );
    }

    const uploadedBackground = backgroundFile
        ? await uploadSessionBackground(adminSupabase, SESSION_BACKGROUND_OWNER.coach, coachId, backgroundFile)
        : null;

    const { data, error } = await adminSupabase
        .from("coaches")
        .insert(createCoachInsert(input, {
            backgroundImagePath: uploadedBackground?.path ?? null,
            createdBy: context.userId,
            id: coachId,
            now,
            status: PUBLISHED_CONTENT_STATUS,
        }))
        .select(COACH_SELECT)
        .single<CoachRow>();

    if (error) {
        if (uploadedBackground) {
            await removeSessionBackground(adminSupabase, uploadedBackground.path).catch(() => undefined);
        }
        throw error;
    }

    return mapCoachRowToListItem(data);
}
