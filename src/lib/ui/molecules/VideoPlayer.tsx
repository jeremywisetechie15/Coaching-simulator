import { Box } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { resolveVideoPlayerSource } from "./video-player";

interface VideoPlayerProps {
    src: string;
    title: string;
}

/** Lecteur vidéo partagé pour les fichiers directs et les intégrations YouTube/Vimeo. */
export function VideoPlayer({ src, title }: VideoPlayerProps) {
    const source = resolveVideoPlayerSource(src);

    return (
        <Box className={uiTokens.videoPlayer.shell}>
            {source.kind === "direct" ? (
                <video className={uiTokens.videoPlayer.media} controls preload="metadata" src={source.url}>
                    <track kind="captions" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                </video>
            ) : (
                <iframe
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={uiTokens.videoPlayer.media}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    src={source.url}
                    title={title}
                />
            )}
        </Box>
    );
}
