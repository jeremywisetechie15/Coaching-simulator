import { createClient } from "@/lib/supabase/server";
import { ForbiddenError } from "@/lib/server/errors";
import { requireAuth } from "@/features/auth/server";
import type { ProfileView } from "@/features/profile/domain/profile";
import type { UpdateProfileDto } from "@/features/profile/dto/update-profile.dto";
import { mapProfileRowToView, type ProfileRow } from "./profile.mapper";

const profileSelect = "email, name, first_name, last_name, bio, avatar_path";

export async function updateCurrentProfile(input: UpdateProfileDto): Promise<ProfileView> {
    const context = await requireAuth();
    const supabase = await createClient();
    const displayName = `${input.firstName} ${input.lastName}`.trim();
    const avatarPath = input.avatarPath?.trim() || null;

    if (avatarPath && !avatarPath.startsWith(`${context.userId}/`)) {
        throw new ForbiddenError("Avatar non autorisé pour cet utilisateur.");
    }

    const { data: profile, error } = await supabase
        .from("profiles")
        .update({
            ...(input.avatarPath !== undefined ? { avatar_path: avatarPath } : {}),
            bio: input.bio,
            first_name: input.firstName,
            last_name: input.lastName,
            name: displayName,
            updated_at: new Date().toISOString(),
        })
        .eq("id", context.userId)
        .select(profileSelect)
        .single<ProfileRow>();

    if (error) {
        throw error;
    }

    return mapProfileRowToView(profile, context.email, context.platformRole);
}
