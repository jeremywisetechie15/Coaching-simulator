"use client";

import { BookOpen, ExternalLink, FileText, Headphones, Image, Play, PlayCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PrepDocument, PrepResourceKind } from "@/features/roleplays/data/preparation";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

type ToneKey = keyof typeof uiTokens.tone;

const kindConfig: Record<
    PrepResourceKind,
    { actionIcon: LucideIcon; actionLabel: string; icon: LucideIcon; label: string; tone: ToneKey }
> = {
    article: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: BookOpen, label: "Article", tone: "success" },
    audio: { actionIcon: Play, actionLabel: "Écouter", icon: Headphones, label: "Audio", tone: "info" },
    document: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: FileText, label: "Document", tone: "info" },
    image: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: Image, label: "Image", tone: "success" },
    pdf: { actionIcon: ExternalLink, actionLabel: "Ouvrir", icon: FileText, label: "PDF", tone: "info" },
    video: { actionIcon: Play, actionLabel: "Lire", icon: PlayCircle, label: "Vidéo", tone: "danger" },
};

interface RoleplayDocumentsModalProps {
    documents: PrepDocument[];
    onClose: () => void;
}

export function RoleplayDocumentsModal({ documents, onClose }: RoleplayDocumentsModalProps) {
    return (
        <Modal
            title="Documents de préparation"
            description="Consultez les documents, vidéos et articles pour vous préparer au scénario."
            onClose={onClose}
            className="max-w-[560px]"
        >
            <Box className="max-h-[min(58vh,520px)] space-y-3 overflow-y-auto pr-1">
                {documents.length === 0 && (
                    <Box className={cn(uiTokens.surface.rowCard, "px-4 py-5 text-center")}>
                        <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                            Aucun document de préparation n&apos;est associé à ce scénario.
                        </Text>
                    </Box>
                )}
                {documents.map((document) => {
                    const config = kindConfig[document.kind];
                    const buttonClassName = cn(uiTokens.action.addButton, "shrink-0");

                    return (
                        <Box key={document.id} className={cn(uiTokens.surface.rowCard, "flex items-center gap-3")}>
                            <Box
                                className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                                    uiTokens.tone[config.tone].soft,
                                )}
                            >
                                <InlineIcon icon={config.icon} className="h-5 w-5" />
                            </Box>
                            <Box className="min-w-0 flex-1">
                                <Text className={cn("text-[14px] font-bold", uiTokens.text.heading)}>{document.title}</Text>
                                <Box className="mt-0.5 flex items-center gap-2">
                                    <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                        {config.label}
                                    </Text>
                                    {document.meta && (
                                        <Text className={cn("text-[12px] font-medium", uiTokens.text.muted)}>
                                            {document.meta}
                                        </Text>
                                    )}
                                </Box>
                            </Box>
                            {document.url ? (
                                <a
                                    href={document.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={buttonClassName}
                                >
                                    <InlineIcon icon={config.actionIcon} className="h-4 w-4" />
                                    {config.actionLabel}
                                </a>
                            ) : (
                                <Button disabled className={cn(buttonClassName, "cursor-not-allowed opacity-60")}>
                                    <InlineIcon icon={config.actionIcon} className="h-4 w-4" />
                                    {config.actionLabel}
                                </Button>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Modal>
    );
}
