export interface PersonaListItem {
    avatarUrl: string | null;
    company: string;
    id: string;
    influenceLabel: "Influent" | "Stable";
    name: string;
    role: string;
}

export const PERSONA_AVATAR_BUCKET = "personas-avatars";

export function getPersonaAvatarPublicUrl(avatarPath: string | null | undefined) {
    const normalizedPath = avatarPath?.trim();

    if (!normalizedPath) {
        return null;
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
        return normalizedPath;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        return null;
    }

    const pathWithoutBucket = normalizedPath.startsWith(`${PERSONA_AVATAR_BUCKET}/`)
        ? normalizedPath.slice(PERSONA_AVATAR_BUCKET.length + 1)
        : normalizedPath;
    const encodedPath = pathWithoutBucket.split("/").map(encodeURIComponent).join("/");

    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${PERSONA_AVATAR_BUCKET}/${encodedPath}`;
}

export function getPersonaInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return "IA";
    }

    return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}
