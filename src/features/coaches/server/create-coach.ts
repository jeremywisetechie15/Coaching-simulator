import { requireAdmin } from "@/features/auth/server";
import {
    isCoachAvatarStoragePath,
    type CoachListItem,
} from "@/features/coaches/domain/coach-list";
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
import { removeCoachAvatar, uploadCoachAvatar } from "./coach-avatar";

interface CreateCoachFiles {
    avatarFile?: File | null;
    backgroundFile?: File | null;
}

export async function createCoach(
    input: SaveCoachDto,
    files: CreateCoachFiles = {},
): Promise<CoachListItem> {
    const { avatarFile = null, backgroundFile = null } = files;
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
    if (!avatarFile && isCoachAvatarStoragePath(input.avatarSrc)) {
        throw new AppError(
            "Un avatar existant ne peut pas être attribué à un nouveau coach.",
            400,
            "COACH_AVATAR_INVALID",
        );
    }

    const uploadedBackground = backgroundFile
        ? await uploadSessionBackground(adminSupabase, SESSION_BACKGROUND_OWNER.coach, coachId, backgroundFile)
        : null;
    let uploadedAvatar: string | null = null;

    try {
        uploadedAvatar = avatarFile
            ? await uploadCoachAvatar(adminSupabase, coachId, avatarFile)
            : null;
    } catch (error) {
        if (uploadedBackground) {
            await removeSessionBackground(adminSupabase, uploadedBackground.path).catch(() => undefined);
        }
        throw error;
    }

    const { data, error } = await adminSupabase
        .from("coaches")
        .insert(createCoachInsert(input, {
            avatarUrl: uploadedAvatar ?? (input.avatarSrc || null),
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
        if (uploadedAvatar) {
            await removeCoachAvatar(adminSupabase, uploadedAvatar).catch(() => undefined);
        }
        throw error;
    }

    return mapCoachRowToListItem(data);
}
