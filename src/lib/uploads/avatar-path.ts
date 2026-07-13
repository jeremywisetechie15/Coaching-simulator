export function isStorageAvatarPath(path: string | null | undefined) {
    const normalizedPath = path?.trim();

    return Boolean(
        normalizedPath
        && !/^https?:\/\//i.test(normalizedPath)
        && !normalizedPath.startsWith("/"),
    );
}

export function normalizeStorageAvatarPath(path: string, bucket: string) {
    return path.startsWith(`${bucket}/`)
        ? path.slice(bucket.length + 1)
        : path;
}

export function getStorageAvatarPublicUrl(
    path: string | null | undefined,
    bucket: string,
) {
    const normalizedPath = path?.trim();

    if (!normalizedPath) return null;
    if (/^https?:\/\//i.test(normalizedPath) || normalizedPath.startsWith("/")) {
        return normalizedPath;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    const pathWithoutBucket = normalizeStorageAvatarPath(normalizedPath, bucket);
    const encodedPath = pathWithoutBucket.split("/").map(encodeURIComponent).join("/");

    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
