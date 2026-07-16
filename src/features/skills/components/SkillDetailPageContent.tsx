"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, Edit3, Target, TrendingUp, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import {
    getSkillLevel,
    SKILL_DIMENSION_LABELS,
    SKILL_DIMENSION_TITLES,
    SKILL_DIMENSIONS,
    skillCategoryStyles,
    type SkillDetail,
    type SkillDimension,
    type SkillLevel,
} from "@/features/skills/domain/skills";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface SkillDetailPageContentProps {
    canManage?: boolean;
    skill: SkillDetail;
}

/** Icône + couleurs par dimension (couleurs réutilisées depuis skillCategoryStyles — SSOT). */
const dimensionIcons: Record<SkillDimension, LucideIcon> = {
    savoir: BookOpen,
    savoir_faire: Target,
    savoir_etre: Users,
};

const dimensionPalette: Record<SkillDimension, { bg: string; border: string; text: string }> = {
    savoir: skillCategoryStyles["Métier"],
    savoir_faire: skillCategoryStyles["Comportementale"],
    savoir_etre: skillCategoryStyles["Transversale"],
};

const levelStyles: Record<SkillLevel, { badge: string; bar: string }> = {
    Faible: { badge: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]", bar: "#EF4444" },
    "À renforcer": { badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]", bar: "#F59E0B" },
    "En progression": { badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]", bar: "#3B82F6" },
    Maîtrisées: { badge: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]", bar: "#22C55E" },
};

/**
 * Scores de progression « placeholder » (déterministes par compétence) tant que la
 * logique de scoring apprenant n'est pas branchée.
 * TODO: remplacer par les vrais scores (résultats apprenant) une fois disponibles.
 */
function placeholderScores(skill: SkillDetail): Record<SkillDimension, number> {
    const seed = Array.from(skill.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const scoreFor = (offset: number) => 72 + ((seed * 7 + offset * 29) % 24);

    return {
        savoir: scoreFor(1),
        savoir_faire: scoreFor(2),
        savoir_etre: scoreFor(3),
    };
}

export function SkillDetailPageContent({ canManage = false, skill }: SkillDetailPageContentProps) {
    const [stateOpen, setStateOpen] = useState(false);
    const categoryStyle = skillCategoryStyles[skill.category];

    const dimensions = SKILL_DIMENSIONS.map((dimension) => ({
        dimension,
        items: skill.dimensionItems
            .filter((item) => item.dimension === dimension && item.isActive)
            .sort((first, second) => first.order - second.order),
    })).filter((entry) => entry.items.length > 0);

    const scores = placeholderScores(skill);
    const overallScore = Math.round(
        SKILL_DIMENSIONS.reduce((total, dimension) => total + scores[dimension], 0) / SKILL_DIMENSIONS.length,
    );
    const overallLevel = getSkillLevel(overallScore);
    const overallStyle = levelStyles[overallLevel];
    const deltaScore = 8 + (Array.from(skill.id).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 17);

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1080px]">
                <Box className="mb-5 flex items-center justify-between gap-4">
                    <ContextualBackLink
                        fallbackHref="/skills"
                        showLabel
                        className={cn("flex items-center gap-2 text-[14px] font-semibold transition hover:opacity-80", uiTokens.text.muted)}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                    </ContextualBackLink>
                    {canManage && (
                        <ContextualLink href={`/skills/${skill.id}/edit`} className={cn(uiTokens.action.addButton, "shrink-0")}>
                            <InlineIcon icon={Edit3} className="h-4 w-4" />
                            Modifier
                        </ContextualLink>
                    )}
                </Box>

                <CardSurface className={uiTokens.surface.formCard}>
                    {/* En-tête */}
                    <Box className="flex flex-wrap items-center gap-3">
                        <Text as="h1" className={cn("text-[26px] font-extrabold leading-tight", uiTokens.text.heading)}>
                            {skill.name}
                        </Text>
                        {skill.isActive && (
                            <Box className="inline-flex h-6 items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-[12px] font-semibold text-[#16A34A]">
                                <Box className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                                Actif
                            </Box>
                        )}
                    </Box>

                    <Box className="mt-3 flex flex-wrap items-center gap-2">
                        <Box
                            className="inline-flex h-7 items-center rounded-lg border px-2.5 text-[12px] font-semibold"
                            style={{ backgroundColor: categoryStyle.bg, borderColor: categoryStyle.border, color: categoryStyle.text }}
                        >
                            {skill.category}
                        </Box>
                        <Box className="inline-flex h-7 items-center rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 text-[12px] font-semibold text-[#6D28D9]">
                            {skill.domain}
                        </Box>
                    </Box>

                    {skill.description && (
                        <Box className={cn("mt-4", uiTokens.surface.mutedPanel)}>
                            <Text className={cn("text-[14px] font-medium leading-7", uiTokens.text.subtle)}>
                                {skill.description}
                            </Text>
                        </Box>
                    )}

                    {/* État de la compétence */}
                    <Divider />
                    <SectionHeading title="État de la compétence" />
                    <Box className="mt-4">
                        <Button
                            onClick={() => setStateOpen((current) => !current)}
                            aria-expanded={stateOpen}
                            className="flex w-full items-center gap-3"
                        >
                            <Box className={cn("inline-flex h-7 shrink-0 items-center rounded-lg border px-2.5 text-[13px] font-bold", overallStyle.badge)}>
                                {overallScore}%
                            </Box>
                            <Box className={cn(uiTokens.progress.track, "h-2.5 flex-1")}>
                                <Box
                                    className={uiTokens.progress.fillBase}
                                    style={{ width: `${overallScore}%`, backgroundColor: overallStyle.bar }}
                                />
                            </Box>
                            <Box className={cn("hidden h-7 shrink-0 items-center rounded-lg border px-2.5 text-[12px] font-semibold sm:inline-flex", overallStyle.badge)}>
                                {overallLevel}
                            </Box>
                            <Box className={cn("hidden shrink-0 items-center gap-1 text-[13px] font-bold sm:flex", uiTokens.text.success)}>
                                <InlineIcon icon={TrendingUp} className="h-4 w-4" />
                                +{deltaScore}%
                            </Box>
                            <InlineIcon
                                icon={stateOpen ? ChevronUp : ChevronDown}
                                className={cn("h-4 w-4 shrink-0", uiTokens.text.muted)}
                            />
                        </Button>

                        {stateOpen && (
                            <Box className="mt-4">
                                <Box className="grid grid-cols-[1.4fr_56px_2fr_116px] gap-4 px-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                                    <Text as="span">Dimension</Text>
                                    <Text as="span">Score</Text>
                                    <Text as="span">Progression</Text>
                                    <Text as="span">Niveau</Text>
                                </Box>
                                <Box className="space-y-2.5">
                                    {SKILL_DIMENSIONS.map((dimension) => {
                                        const score = scores[dimension];
                                        const level = getSkillLevel(score);
                                        const style = levelStyles[level];
                                        const palette = dimensionPalette[dimension];

                                        return (
                                            <Box key={dimension} className="grid grid-cols-[1.4fr_56px_2fr_116px] items-center gap-4">
                                                <Box className="flex items-center gap-2.5">
                                                    <Box
                                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                                        style={{ backgroundColor: palette.bg, color: palette.text }}
                                                    >
                                                        <InlineIcon icon={dimensionIcons[dimension]} className="h-4 w-4" />
                                                    </Box>
                                                    <Text className={cn("text-[13px] font-semibold", uiTokens.text.heading)}>
                                                        {SKILL_DIMENSION_TITLES[dimension]}
                                                    </Text>
                                                </Box>
                                                <Text className={cn("text-[13px] font-bold", uiTokens.text.heading)}>{score}%</Text>
                                                <Box className={cn(uiTokens.progress.track, "h-2")}>
                                                    <Box
                                                        className={uiTokens.progress.fillBase}
                                                        style={{ width: `${score}%`, backgroundColor: style.bar }}
                                                    />
                                                </Box>
                                                <Box className={cn("inline-flex h-6 w-fit items-center rounded-full border px-2.5 text-[12px] font-semibold", style.badge)}>
                                                    {level}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* Fonctions associées */}
                    {skill.functions.length > 0 && (
                        <>
                            <Divider />
                            <SectionHeading title="Fonctions associées" />
                            <Box className="mt-4 flex flex-wrap gap-2">
                                {skill.functions.map((fn) => (
                                    <Box
                                        key={fn}
                                        className="inline-flex h-8 items-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151]"
                                    >
                                        {fn}
                                    </Box>
                                ))}
                            </Box>
                        </>
                    )}

                    {/* Dimensions de la compétence */}
                    <Divider />
                    <SectionHeading title="Dimensions de la compétence" />
                    {dimensions.length > 0 ? (
                        <Box className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {dimensions.map(({ dimension, items }) => {
                                const palette = dimensionPalette[dimension];

                                return (
                                    <Box key={dimension} className={uiTokens.surface.dimensionCard}>
                                        <Box className="flex items-center gap-3">
                                            <Box
                                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                                                style={{ backgroundColor: palette.bg, color: palette.text }}
                                            >
                                                <InlineIcon icon={dimensionIcons[dimension]} className="h-5 w-5" />
                                            </Box>
                                            <Box>
                                                <Text className={cn("text-[14px] font-extrabold leading-tight", uiTokens.text.heading)}>
                                                    {SKILL_DIMENSION_TITLES[dimension]}
                                                </Text>
                                                <Text className={cn("text-[12px] font-medium", uiTokens.text.muted)}>
                                                    {SKILL_DIMENSION_LABELS[dimension]}
                                                </Text>
                                            </Box>
                                        </Box>
                                        <Box as="ul" className="mt-4 space-y-2.5">
                                            {items.map((item) => (
                                                <Box as="li" key={item.id} className="flex items-start gap-2.5">
                                                    <Box
                                                        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                                                        style={{ backgroundColor: palette.text }}
                                                    />
                                                    <Text className={cn("text-[13px] font-medium leading-6", uiTokens.text.subtle)}>
                                                        {item.label}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : (
                        <Text className={cn("mt-4 text-[14px] font-medium", uiTokens.text.muted)}>
                            Aucune dimension renseignée pour le moment.
                        </Text>
                    )}
                </CardSurface>
            </Box>
        </Box>
    );
}

function Divider() {
    return <Box className={uiTokens.surface.divider} />;
}

function SectionHeading({ title }: { title: string }) {
    return (
        <Text as="h2" className={cn("text-[17px] font-extrabold", uiTokens.text.heading)}>
            {title}
        </Text>
    );
}
