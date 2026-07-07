import type { ProfileView } from "@/features/profile/domain/profile";
import type { PlatformRole } from "@/features/users/domain/users";
import { getProfileAvatarPublicUrl } from "@/features/profile/domain/profile-avatar";

export interface ProfileRow {
    avatar_path: string | null;
    bio: string | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    name: string | null;
}

function splitName(name: string | null) {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    const [firstName = "", ...lastNameParts] = parts;

    return {
        firstName,
        lastName: lastNameParts.join(" "),
    };
}

export function mapProfileRowToView(
    row: ProfileRow | null,
    fallbackEmail: string,
    platformRole: PlatformRole,
): ProfileView {
    const nameParts = splitName(row?.name ?? null);

    return {
        avatarPath: row?.avatar_path ?? null,
        avatarUrl: getProfileAvatarPublicUrl(row?.avatar_path),
        bio: row?.bio ?? "",
        email: fallbackEmail,
        firstName: row?.first_name ?? nameParts.firstName,
        lastName: row?.last_name ?? nameParts.lastName,
        platformRole,
    };
}
