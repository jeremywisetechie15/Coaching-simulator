"use client";

import { Sparkles } from "lucide-react";
import type { TranscriptCorrection } from "@/features/roleplays/data/evaluation";
import { buildTranscriptHighlightSegments } from "@/features/roleplays/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export function TranscriptCorrectionToggle({
    enabled,
    onToggle,
}: {
    enabled: boolean;
    onToggle: () => void;
}) {
    const actionLabel = enabled
        ? "Masquer les corrections IA"
        : "Afficher les corrections IA";

    return (
        <Button
            aria-controls="roleplay-transcript-messages"
            aria-label={actionLabel}
            aria-pressed={enabled}
            onClick={onToggle}
            title={actionLabel}
            className={cn(
                "flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg border px-4 text-[13px] font-extrabold transition sm:w-auto",
                enabled
                    ? uiTokens.roleplayEvaluation.transcriptCorrection.toggleActive
                    : uiTokens.roleplayEvaluation.transcriptCorrection.toggleIdle,
            )}
        >
            <InlineIcon icon={Sparkles} className="h-4 w-4" />
            Correction IA
        </Button>
    );
}

export function TranscriptMessageText({
    corrections,
    text,
}: {
    corrections: readonly TranscriptCorrection[];
    text: string;
}) {
    const segments = buildTranscriptHighlightSegments(
        text,
        corrections.map((correction) => correction.original),
    );

    return segments.map((segment, index) => (
        segment.highlighted ? (
            <mark
                key={`${index}-${segment.text}`}
                className={cn(
                    "rounded-sm px-0.5 text-inherit",
                    uiTokens.roleplayEvaluation.transcriptCorrection.highlight,
                )}
            >
                {segment.text}
            </mark>
        ) : (
            <span key={`${index}-${segment.text}`}>{segment.text}</span>
        )
    ));
}

export function TranscriptCorrectionPanel({
    corrections,
}: {
    corrections: readonly TranscriptCorrection[];
}) {
    if (corrections.length === 0) return null;

    return (
        <Box
            as="section"
            aria-label="Correction IA"
            className={cn(
                "mt-2.5 overflow-hidden rounded-lg border border-l-[3px] px-4 py-3.5",
                uiTokens.roleplayEvaluation.transcriptCorrection.panel,
            )}
        >
            <Box className="flex items-center gap-2">
                <InlineIcon
                    icon={Sparkles}
                    className={cn(
                        "h-4 w-4",
                        uiTokens.roleplayEvaluation.transcriptCorrection.titleIcon,
                    )}
                />
                <Text
                    as="h3"
                    className={cn(
                        "text-[13px] font-extrabold",
                        uiTokens.roleplayEvaluation.transcriptCorrection.title,
                    )}
                >
                    Correction IA
                </Text>
            </Box>

            <Box className="mt-3 space-y-4">
                {corrections.map((correction, index) => (
                    <Box
                        key={`${correction.criterionRef}-${index}`}
                        className={index > 0
                            ? cn(
                                "border-t pt-4",
                                uiTokens.roleplayEvaluation.transcriptCorrection.divider,
                            )
                            : undefined}
                    >
                        <Text
                            className={cn(
                                "text-[11px] font-extrabold uppercase",
                                uiTokens.roleplayEvaluation.transcriptCorrection.suggestionLabel,
                            )}
                        >
                            Verbatim préconisé
                        </Text>
                        <Text
                            className={cn(
                                "mt-1 text-[14px] font-semibold leading-6",
                                uiTokens.roleplayEvaluation.transcriptCorrection.suggestionText,
                            )}
                        >
                            « {correction.suggestion} »
                        </Text>

                        <Text
                            className={cn(
                                "mt-3 text-[11px] font-extrabold uppercase",
                                uiTokens.roleplayEvaluation.transcriptCorrection.reasonLabel,
                            )}
                        >
                            Pourquoi
                        </Text>
                        <Text
                            className={cn(
                                "mt-1 text-[13px] leading-5",
                                uiTokens.roleplayEvaluation.transcriptCorrection.reasonText,
                            )}
                        >
                            {correction.reason}
                        </Text>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
