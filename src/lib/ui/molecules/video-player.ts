export type VideoPlayerSource =
    | { kind: "direct"; url: string }
    | { kind: "vimeo"; url: string }
    | { kind: "youtube"; url: string };

const YOUTUBE_HOSTS = new Set([
    "m.youtube.com",
    "www.youtube-nocookie.com",
    "www.youtube.com",
    "youtube-nocookie.com",
    "youtube.com",
    "youtu.be",
]);
const VIMEO_HOSTS = new Set(["player.vimeo.com", "vimeo.com", "www.vimeo.com"]);
const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{6,}$/;
const VIMEO_VIDEO_ID_PATTERN = /^\d+$/;

function getYoutubeVideoId(url: URL) {
    if (url.hostname === "youtu.be") {
        return url.pathname.split("/").filter(Boolean)[0];
    }

    if (url.pathname === "/watch") {
        return url.searchParams.get("v") ?? undefined;
    }

    const [route, videoId] = url.pathname.split("/").filter(Boolean);
    return route === "embed" || route === "live" || route === "shorts" ? videoId : undefined;
}

function getVimeoVideoId(url: URL) {
    return url.pathname
        .split("/")
        .filter(Boolean)
        .reverse()
        .find((segment) => VIMEO_VIDEO_ID_PATTERN.test(segment));
}

/**
 * Convertit uniquement les fournisseurs vidéo connus vers leurs URLs d'intégration.
 * Toute autre URL reste une source vidéo directe (fichier uploadé, MP4/WebM distant…).
 */
export function resolveVideoPlayerSource(value: string): VideoPlayerSource {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        return { kind: "direct", url: value };
    }

    if (YOUTUBE_HOSTS.has(url.hostname)) {
        const videoId = getYoutubeVideoId(url);

        if (videoId && YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
            return {
                kind: "youtube",
                url: `https://www.youtube-nocookie.com/embed/${videoId}`,
            };
        }
    }

    if (VIMEO_HOSTS.has(url.hostname)) {
        const videoId = getVimeoVideoId(url);

        if (videoId) {
            return {
                kind: "vimeo",
                url: `https://player.vimeo.com/video/${videoId}`,
            };
        }
    }

    return { kind: "direct", url: value };
}
