export const PROFILE_AVATAR_BUCKET = "avatars";

export const PROFILE_AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export const PROFILE_AVATAR_MIME_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
} as const;

export type ProfileAvatarMimeType = keyof typeof PROFILE_AVATAR_MIME_TYPES;

export const PROFILE_AVATAR_ACCEPT = Object.keys(PROFILE_AVATAR_MIME_TYPES).join(",");

interface ProfileIdentity {
    email?: string;
    firstName?: string;
    lastName?: string;
}

export function getProfileAvatarExtension(mimeType: string) {
    return PROFILE_AVATAR_MIME_TYPES[mimeType as ProfileAvatarMimeType] ?? null;
}

export function getProfileAvatarPublicUrl(avatarPath: string | null | undefined) {
    if (!avatarPath) {
        return null;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        return null;
    }

    const encodedPath = avatarPath.split("/").map(encodeURIComponent).join("/");

    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PROFILE_AVATAR_BUCKET}/${encodedPath}`;
}

export function getProfileInitials(profile: ProfileIdentity) {
    const nameParts = [profile.firstName, profile.lastName]
        .map((part) => part?.trim())
        .filter(Boolean);

    if (nameParts.length > 0) {
        return nameParts.map((part) => part?.[0]).join("").slice(0, 2).toUpperCase();
    }

    return (profile.email?.trim()[0] ?? "U").toUpperCase();
}
