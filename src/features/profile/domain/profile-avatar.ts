export const PROFILE_AVATAR_BUCKET = "avatars";

interface ProfileIdentity {
    email?: string;
    firstName?: string;
    lastName?: string;
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
