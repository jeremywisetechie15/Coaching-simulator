import { requireAdmin } from "@/features/auth/server";
import {
    isCoachAvatarStoragePath,
    type CoachListItem,
} from "@/features/coaches/domain/coach-list";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { assertContentStatusTransition } from "@/features/content/server";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
    uploadSessionBackground,
} from "@/lib/uploads/session-background";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";
import {
    isOwnedCoachAvatarPath,
    removeCoachAvatar,
    uploadCoachAvatar,
} from "./coach-avatar";

interface UpdateCoachFiles {
    avatarFile?: File | null;
    backgroundFile?: File | null;
}

export async function updateCoach(
    coachId: string,
    input: SaveCoachDto,
    files: UpdateCoachFiles = {},
): Promise<CoachListItem> {
    const { avatarFile = null, backgroundFile = null } = files;
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data: existingCoach, error: existingCoachError } = await adminSupabase
        .from("coaches")
        .select("avatar_url, background_image_path, status")
        .eq("id", coachId)
        .maybeSingle<{
            avatar_url: string | null;
            background_image_path: string | null;
            status: SaveCoachDto["status"];
        }>();

    if (existingCoachError) throw existingCoachError;
    if (!existingCoach) throw new NotFoundError("Coach introuvable.");
    assertContentStatusTransition(existingCoach.status, input.status);
    if (!backgroundFile && input.backgroundImagePath && input.backgroundImagePath !== existingCoach.background_image_path) {
        throw new AppError(
            "Le fond de session sélectionné n'appartient pas à ce coach.",
            400,
            "COACH_BACKGROUND_INVALID",
        );
    }
    if (
        !avatarFile
        && isCoachAvatarStoragePath(input.avatarSrc)
        && input.avatarSrc !== existingCoach.avatar_url
    ) {
        throw new AppError(
            "L'avatar sélectionné n'appartient pas à ce coach.",
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

    const nextAvatarUrl = uploadedAvatar ?? (input.avatarSrc || null);
    const nextBackgroundPath = uploadedBackground?.path ?? (input.backgroundImagePath || null);
    const { data, error } = await adminSupabase
        .from("coaches")
        .update({
            avatar_url: nextAvatarUrl,
            background_image_path: nextBackgroundPath,
            certifications: input.certifications || null,
            coaching_style: input.coachingStyle || null,
            diploma: input.diploma || null,
            disc_profile: input.discProfile || null,
            expertise_domain: input.expertiseDomain || null,
            name: input.name,
            status: input.status,
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
        if (uploadedAvatar) {
            await removeCoachAvatar(adminSupabase, uploadedAvatar).catch(() => undefined);
        }
        throw error;
    }

    if (!data) {
        if (uploadedBackground) {
            await removeSessionBackground(adminSupabase, uploadedBackground.path).catch(() => undefined);
        }
        if (uploadedAvatar) {
            await removeCoachAvatar(adminSupabase, uploadedAvatar).catch(() => undefined);
        }
        throw new NotFoundError("Coach introuvable.");
    }

    if (existingCoach.background_image_path && existingCoach.background_image_path !== nextBackgroundPath) {
        await removeSessionBackground(adminSupabase, existingCoach.background_image_path).catch((cleanupError) => {
            console.error("Unable to remove previous coach background:", cleanupError);
        });
    }

    if (
        existingCoach.avatar_url !== nextAvatarUrl
        && isOwnedCoachAvatarPath(existingCoach.avatar_url, coachId)
    ) {
        await removeCoachAvatar(adminSupabase, existingCoach.avatar_url).catch((cleanupError) => {
            console.error("Unable to remove previous coach avatar:", cleanupError);
        });
    }

    return mapCoachRowToListItem(data);
}
