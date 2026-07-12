"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, ArrowLeft, Check, Plus } from "lucide-react";
import type { TranscriptMessage } from "@/features/roleplays/data/evaluation";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface SimulationViewProps {
    backLabel?: string;
    /** URL de l'iframe runtime public (`/iframe?...`) — embarquée telle quelle, jamais modifiée. */
    iframeSrc: string | null;
    /** Libellé de l'onglet de gauche (ex. « AI Persona », « AI Coach »). */
    liveTabLabel: string;
    onBack: () => void;
    /** Panneau contextuel affiché sous l'iframe (sous-onglets, feedback…). */
    panel?: ReactNode;
    personaName: string;
    title: string;
    transcript: TranscriptMessage[];
    transcriptAside?: ReactNode;
    addedTranscriptMessageIds?: ReadonlySet<string>;
    onAddTranscriptMessage?: (message: TranscriptMessage) => void;
}

export function SimulationView({
    backLabel = "Retour",
    iframeSrc,
    liveTabLabel,
    onBack,
    panel,
    personaName,
    title,
    transcript,
    transcriptAside,
    addedTranscriptMessageIds,
    onAddTranscriptMessage,
}: SimulationViewProps) {
    const [tab, setTab] = useState<"live" | "transcription">("live");

    const tabs: { key: "live" | "transcription"; label: string }[] = [
        { key: "live", label: liveTabLabel },
        { key: "transcription", label: "Transcription" },
    ];

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1320px]">
                <Box className="mb-4">
                    <Button onClick={onBack} className={cn(uiTokens.action.backButton, "mb-3")}>
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                        {backLabel}
                    </Button>
                    <Box className="flex flex-wrap items-center justify-between gap-3">
                        <Text as="h1" className={cn("text-[18px] font-extrabold", uiTokens.text.heading)}>
                            {title}
                        </Text>
                        <Box role="tablist" className="flex flex-wrap gap-2">
                            {tabs.map((item) => {
                                const isActive = item.key === tab;
                                return (
                                    <button
                                        key={item.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setTab(item.key)}
                                        className={cn(
                                            "flex h-10 items-center rounded-lg px-4 text-[14px] font-bold transition",
                                            isActive
                                                ? "bg-[#5140F0] text-white"
                                                : "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#D5D7DE]",
                                        )}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </Box>
                    </Box>
                </Box>

                {tab === "live" ? (
                    <Box className="space-y-5">
                        <CardSurface className={uiTokens.session.frameCard}>
                            {iframeSrc ? (
                                <iframe
                                    title={title}
                                    src={iframeSrc}
                                    className={uiTokens.session.frame}
                                    allow="microphone; camera; autoplay"
                                />
                            ) : (
                                <Box className={uiTokens.session.frameFallback}>
                                    <InlineIcon icon={AlertCircle} className="h-12 w-12 text-[#DC2626]" />
                                    <Text className="text-[15px] font-bold text-[#374151]">
                                        Simulation indisponible pour ce scénario
                                    </Text>
                                    <Text className="max-w-[420px] text-[13px] font-medium leading-6 text-[#6B7280]">
                                        Aucun identifiant de scénario n&apos;est associé à ce roleplay.
                                    </Text>
                                </Box>
                            )}
                        </CardSurface>
                        {panel}
                    </Box>
                ) : (
                    <Box className={cn(Boolean(transcriptAside) && uiTokens.transcript.grid)}>
                        <CardSurface className={uiTokens.transcript.card}>
                            {transcript.length === 0 ? (
                                <Text className={uiTokens.transcript.empty}>Aucune transcription disponible.</Text>
                            ) : (
                                <Box className="space-y-5">
                                    {transcript.map((message, index) => {
                                        const isPersona = message.speaker === "persona";
                                        const isAdded = Boolean(message.id && addedTranscriptMessageIds?.has(message.id));
                                        return (
                                            <Box
                                                key={message.id ?? index}
                                                className={cn(
                                                    "group/message flex gap-3",
                                                    isPersona ? "flex-row-reverse" : "flex-row",
                                                )}
                                            >
                                                <Box
                                                    className={cn(
                                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                                        isPersona ? uiTokens.transcript.avatarAi : uiTokens.transcript.avatarUser,
                                                    )}
                                                >
                                                    {isPersona ? "AI" : "Moi"}
                                                </Box>
                                                <Box className={cn("max-w-[78%]", isPersona ? "text-right" : "text-left")}>
                                                    <Box className={cn(uiTokens.transcript.meta, isPersona ? "justify-end" : "justify-start")}>
                                                        <Text as="span">{isPersona ? personaName : "Moi"}</Text>
                                                        <Text as="span">{message.time}</Text>
                                                    </Box>
                                                    <Box
                                                        className={cn(
                                                            "mt-1.5 rounded-2xl px-4 py-2.5 text-[14px] font-medium leading-6",
                                                            isPersona ? uiTokens.transcript.bubbleAi : uiTokens.transcript.bubbleUser,
                                                        )}
                                                    >
                                                        {message.text}
                                                    </Box>
                                                    {onAddTranscriptMessage ? (
                                                        <Button
                                                            className={uiTokens.transcript.action}
                                                            disabled={isAdded}
                                                            onClick={() => onAddTranscriptMessage(message)}
                                                        >
                                                            <InlineIcon
                                                                icon={isAdded ? Check : Plus}
                                                                className={uiTokens.transcript.actionIcon}
                                                            />
                                                            {isAdded ? "Ajouté aux notes" : "Ajouter aux notes"}
                                                        </Button>
                                                    ) : null}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}
                        </CardSurface>
                        {transcriptAside}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
