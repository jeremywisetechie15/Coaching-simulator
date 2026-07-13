import { requireAdmin } from "@/features/auth/server";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { saveCoachDto } from "@/features/coaches/dto/save-coach.dto";
import { CONTENT_STATUS } from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    copySessionBackground,
    removeSessionBackground,
    SESSION_BACKGROUND_OWNER,
} from "@/lib/uploads/session-background";
import { createCoachInsert } from "./coach.persistence";
import {
    copyCoachAvatar,
    isOwnedCoachAvatarPath,
    removeCoachAvatar,
} from "./coach-avatar";
import { COACH_SELECT, mapCoachRowToListItem, type CoachRow } from "./coach.mapper";
import { getCoachById } from "./get-coach-by-id";

export async function duplicateCoach(coachId: string): Promise<CoachListItem> {
    const context = await requireAdmin();
    const source = await getCoachById(coachId);

    if (!source) throw new NotFoundError("Coach introuvable.");

    const adminSupabase = createAdminClient();
    const duplicateId = crypto.randomUUID();
    const now = new Date().toISOString();
    const duplicateName = await resolveDuplicateName(adminSupabase, {
        column: "name",
        maxLength: 160,
        sourceName: source.name,
        table: "coaches",
    });
    const baseInput = saveCoachDto.parse({
        ...source,
        name: duplicateName,
    });
    const duplicatedBackgroundPath = await copySessionBackground(
        adminSupabase,
        SESSION_BACKGROUND_OWNER.coach,
        duplicateId,
        source.backgroundImagePath,
    );
    let duplicatedAvatarPath: string | null = null;

    try {
        duplicatedAvatarPath = await copyCoachAvatar(
            adminSupabase,
            source.avatarSrc,
            duplicateId,
        );
    } catch (error) {
        if (duplicatedBackgroundPath) {
            await removeSessionBackground(adminSupabase, duplicatedBackgroundPath).catch(() => undefined);
        }
        throw error;
    }
    const input = {
        ...baseInput,
        avatarSrc: duplicatedAvatarPath ?? "",
        backgroundImagePath: duplicatedBackgroundPath ?? "",
    };

    const { data, error } = await adminSupabase
        .from("coaches")
        .insert(createCoachInsert(input, {
            avatarUrl: duplicatedAvatarPath,
            backgroundImagePath: duplicatedBackgroundPath,
            createdBy: context.userId,
            id: duplicateId,
            now,
            status: CONTENT_STATUS.draft,
        }))
        .select(COACH_SELECT)
        .single<CoachRow>();

    if (error) {
        if (duplicatedBackgroundPath) {
            await removeSessionBackground(adminSupabase, duplicatedBackgroundPath).catch(() => undefined);
        }
        if (isOwnedCoachAvatarPath(duplicatedAvatarPath, duplicateId)) {
            await removeCoachAvatar(adminSupabase, duplicatedAvatarPath).catch(() => undefined);
        }
        throw error;
    }

    return mapCoachRowToListItem(data);
}
