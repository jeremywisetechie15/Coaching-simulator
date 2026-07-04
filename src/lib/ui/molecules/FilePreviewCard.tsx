"use client";

import { ExternalLink, FileText, Headphones, Image as ImageIcon, Link as LinkIcon, PlayCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type FilePreviewKind = "audio" | "document" | "image" | "link" | "video";

type ToneKey = keyof typeof uiTokens.tone;

const filePreviewConfig: Record<
    FilePreviewKind,
    { actionIcon: LucideIcon; actionLabel: string; icon: LucideIcon; label: string; tone: ToneKey }
> = {
    audio: { actionIcon: PlayCircle, actionLabel: "Écouter", icon: Headphones, label: "Audio", tone: "info" },
    document: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: FileText, label: "Document", tone: "info" },
    image: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: ImageIcon, label: "Image", tone: "success" },
    link: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: LinkIcon, label: "Lien", tone: "neutral" },
    video: { actionIcon: PlayCircle, actionLabel: "Lire", icon: PlayCircle, label: "Vidéo", tone: "danger" },
};

interface FilePreviewCardProps {
    className?: string;
    href?: string;
    kind: FilePreviewKind;
    meta?: string;
    previewName?: string;
    title: string;
}

function isPdfResource(...values: Array<string | undefined>) {
    return values.some((value) => Boolean(value && /\.pdf(?:$|[?#])/i.test(value)));
}

export function FilePreviewCard({ className, href, kind, meta, previewName, title }: FilePreviewCardProps) {
    const config = filePreviewConfig[kind];
    const isPdf = isPdfResource(title, meta, previewName);
    const canPreview = Boolean(href) && (kind === "audio" || kind === "image" || kind === "video" || isPdf);

    return (
        <Box className={cn(uiTokens.surface.rowCard, "space-y-3", className)}>
            <Box className="flex items-center gap-3">
                <Box
                    className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                        uiTokens.tone[config.tone].soft,
                    )}
                >
                    <InlineIcon icon={config.icon} className="h-5 w-5" />
                </Box>
                <Box className="min-w-0 flex-1">
                    <Text className={cn("truncate text-[14px] font-bold", uiTokens.text.heading)}>{title}</Text>
                    <Box className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                            {config.label}
                        </Text>
                        {meta && (
                            <Text className={cn("text-[12px] font-medium", uiTokens.text.muted)}>
                                {meta}
                            </Text>
                        )}
                    </Box>
                </Box>
                {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className={cn(uiTokens.action.addButton, "shrink-0")}>
                        <InlineIcon icon={config.actionIcon} className="h-4 w-4" />
                        {config.actionLabel}
                    </a>
                ) : (
                    <Button disabled className={cn(uiTokens.action.addButton, "shrink-0 cursor-not-allowed opacity-60")}>
                        <InlineIcon icon={config.actionIcon} className="h-4 w-4" />
                        {config.actionLabel}
                    </Button>
                )}
            </Box>

            {canPreview && href && (
                <Box className={cn("overflow-hidden p-0", uiTokens.surface.mutedPanel)}>
                    {kind === "image" && (
                        <Box
                            aria-label={title}
                            role="img"
                            className="h-[220px] bg-contain bg-center bg-no-repeat"
                            style={{ backgroundImage: `url("${href}")` }}
                        />
                    )}
                    {kind === "video" && (
                        <video className="aspect-video w-full bg-black" controls preload="metadata" src={href}>
                            <track kind="captions" />
                        </video>
                    )}
                    {kind === "audio" && (
                        <audio className="w-full" controls preload="metadata" src={href}>
                            Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                    )}
                    {kind === "document" && isPdf && (
                        <iframe className="h-[360px] w-full" src={href} title={title} />
                    )}
                </Box>
            )}
        </Box>
    );
}
