"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Lightbulb, NotebookPen } from "lucide-react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import { DiscProfileBadge } from "@/features/content/components";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { difficultyBadgeStyles } from "@/features/roleplays/data/roleplays";
import type { Method } from "@/features/methods/data/methods";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import {
    ROLEPLAY_ROUTES,
    countRoleplayCoachNotes,
    replaceRoleplayCoachNoteGroup,
    type RoleplayCoachNoteGroup,
} from "@/features/roleplays/domain";
import { getCoachInitials } from "@/features/coaches/domain/coach-list";
import { RoleplayCoachNotesModal } from "./RoleplayCoachNotesModal";
import type { StepCoachVariant } from "./RoleplayStepCoachPageContent";

interface RoleplayStepsPageContentProps {
    roleplay: RoleplayItem;
    referenceSessionId?: string;
    method: Method;
    noteGroups: RoleplayCoachNoteGroup[];
    variant?: StepCoachVariant;
}

/** Palette appliquée aux cartes d'étape par position (générique : 1 à 4+). */
const stepPalette = [
    { bg: "#EFF4FD", border: "#C9D8F4", title: "#3061C8" },
    { bg: "#F7F0FD", border: "#E3CDF4", title: "#8B2FD6" },
    { bg: "#EEF9F0", border: "#C5E8CE", title: "#15A148" },
    { bg: "#FEF1F2", border: "#F8CDD1", title: "#E0345B" },
];

export function RoleplayStepsPageContent({
    roleplay,
    method,
    noteGroups,
    referenceSessionId,
    variant = "prepare",
}: RoleplayStepsPageContentProps) {
    const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
    const isImprove = variant === "improve";
    const verb = isImprove ? "S'améliorer" : "Se préparer";
    const coachName = roleplay.coachName?.trim() || "Coach IA";
    const coachAvatarSrc = roleplay.coachAvatarSrc?.trim() || "";
    const [savedNoteGroups, setSavedNoteGroups] = useState(noteGroups);
    const [activeNotesStepOrder, setActiveNotesStepOrder] = useState<number | null>(null);
    const stepSuffix = isImprove
        ? `?coach=after${referenceSessionId ? `&sessionId=${encodeURIComponent(referenceSessionId)}` : ""}`
        : "";

    useEffect(() => {
        setSavedNoteGroups(noteGroups);
    }, [noteGroups]);

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5">
                    <ContextualBackLink
                        fallbackHref={ROLEPLAY_ROUTES.app.detail(roleplay.id)}
                        showLabel
                        className={uiTokens.action.backButton}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>
                </Box>

                <CardSurface className="rounded-[18px] border border-[#E9E7FB] bg-gradient-to-b from-[#F6F4FE] to-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-6">
                    <Box className="flex flex-col items-center text-center">
                        <Box className="h-[88px] w-[88px] overflow-hidden rounded-full border-[3px] border-[#E7DCFB] shadow-[0_8px_18px_rgba(81,64,240,0.18)]">
                            {coachAvatarSrc ? (
                                <Box
                                    aria-label={coachName}
                                    role="img"
                                    className={uiTokens.entityDetails.avatarImage}
                                    style={{ backgroundImage: `url(${coachAvatarSrc})` }}
                                />
                            ) : (
                                <Box className={uiTokens.entityDetails.avatarFallback}>
                                    <Text className={uiTokens.entityDetails.avatarInitials}>
                                        {getCoachInitials(coachName)}
                                    </Text>
                                </Box>
                            )}
                        </Box>
                        <Text
                            as="h1"
                            className="mt-3 border-b-2 border-[#5140F0] pb-1 text-[22px] font-extrabold text-[#111827]"
                        >
                            {coachName}
                        </Text>
                        <Box className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                            <Box className="inline-flex h-6 items-center rounded-md bg-[#F3E8FD] px-2.5 text-[12px] font-semibold text-[#8B2FD6]">
                                {roleplay.category}
                            </Box>
                            <Box
                                className="inline-flex h-6 items-center rounded-md border px-2.5 text-[12px] font-semibold"
                                style={{
                                    backgroundColor: difficultyStyle.bg,
                                    borderColor: difficultyStyle.border,
                                    color: difficultyStyle.text,
                                }}
                            >
                                {roleplay.difficulty}
                            </Box>
                            <DiscProfileBadge
                                profile={roleplay.disc}
                                className="h-6 rounded-md border-0 text-[12px]"
                            />
                        </Box>
                    </Box>

                    <Text as="h2" className="mt-6 text-center text-[16px] font-extrabold text-[#1F2937]">
                        {verb} avec le coach IA sur des objectifs pédagogiques spécifiques
                    </Text>
                    <Text className="mt-0.5 text-center text-[12px] font-medium text-[#6B7280]">
                        {method.name} · {method.steps.length} étapes pédagogiques
                    </Text>

                    <Box className="mt-4 grid gap-3 md:grid-cols-2">
                        {method.steps.map((step, index) => {
                            const palette = stepPalette[index % stepPalette.length];
                            const stepNumber = index + 1;
                            const stepNoteGroups = savedNoteGroups.filter((group) =>
                                step.id
                                    ? group.methodStepId === step.id
                                    : group.stepOrder === stepNumber,
                            );
                            const stepNoteCount = countRoleplayCoachNotes(stepNoteGroups);

                            return (
                                <Box
                                    key={step.title}
                                    className="flex flex-col rounded-[12px] border p-4"
                                    style={{ backgroundColor: palette.bg, borderColor: palette.border }}
                                >
                                    <Text
                                        className="text-[11px] font-bold uppercase tracking-wide"
                                        style={{ color: palette.title }}
                                    >
                                        Étape {stepNumber}
                                    </Text>
                                    <Text
                                        as="h3"
                                        className="mt-0.5 text-[14px] font-extrabold"
                                        style={{ color: palette.title }}
                                    >
                                        {step.title}
                                    </Text>
                                    <Box
                                        className={cn(
                                            "mt-auto grid gap-2 pt-3",
                                            stepNoteCount > 0 && "sm:grid-cols-2",
                                        )}
                                    >
                                        <ContextualLink
                                            href={`/roleplays/${roleplay.id}/steps/${stepNumber}${stepSuffix}`}
                                            className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#C9C2FB] bg-white text-[12px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                                        >
                                            <InlineIcon icon={Lightbulb} className="h-3.5 w-3.5" />
                                            {verb} avec l&apos;IA
                                        </ContextualLink>
                                        {stepNoteCount > 0 && (
                                            <Button
                                                className={cn(uiTokens.action.accentSecondaryButton, "w-full")}
                                                onClick={() => setActiveNotesStepOrder(stepNumber)}
                                            >
                                                <InlineIcon icon={NotebookPen} className="h-4 w-4" />
                                                Voir mes notes ({stepNoteCount})
                                            </Button>
                                        )}
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>

                    {!isImprove && (
                        <Box className="mt-6 flex justify-center">
                            <ContextualLink
                                href={`/roleplays/${roleplay.id}`}
                                className="flex h-10 items-center justify-center rounded-lg bg-[#5140F0] px-5 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.24)] transition hover:bg-[#4635E7]"
                            >
                                Commencer l&apos;entraînement complet
                            </ContextualLink>
                        </Box>
                    )}
                </CardSurface>
            </Box>

            {activeNotesStepOrder !== null && (
                <RoleplayCoachNotesModal
                    groups={savedNoteGroups.filter((group) =>
                        group.stepOrder === activeNotesStepOrder,
                    )}
                    onClose={() => setActiveNotesStepOrder(null)}
                    onGroupSaved={(group) => setSavedNoteGroups((current) =>
                        replaceRoleplayCoachNoteGroup(current, group)
                    )}
                    roleplayId={roleplay.id}
                    title={`Mes notes - ${method.steps[activeNotesStepOrder - 1]?.title ?? `Étape ${activeNotesStepOrder}`}`}
                />
            )}
        </Box>
    );
}
