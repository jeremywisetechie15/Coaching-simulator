"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowUpRight,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Crosshair,
    MessageSquare,
    Phone,
    ShieldCheck,
    Target,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    progressCompetencies,
    scoreLevel,
    type DimensionKey,
    type ProgressCompetency,
    type ProgressStep,
    type RoleplayProgress,
} from "@/features/roleplays/domain";
import { CompetencyRadarChart } from "./CompetencyRadarChart";

interface RoleplayProgressPageContentProps {
    backHref: string;
    progress: RoleplayProgress;
}

const dimensionIcons: Record<DimensionKey, LucideIcon> = {
    savoir: BookOpen,
    "savoir-faire": Crosshair,
    "savoir-etre": Users,
};

/** Couleur d'icône par dimension (classes statiques — sûres pour le JIT Tailwind). */
const dimensionIconColor: Record<DimensionKey, string> = {
    savoir: "text-[#3B6FD0]",
    "savoir-faire": "text-[#8B2FD6]",
    "savoir-etre": "text-[#2563EB]",
};

const stepIcons: Record<ProgressStep["icon"], { icon: LucideIcon; tone: string }> = {
    phone: { icon: Phone, tone: "bg-[#E7EDFD] text-[#3B6FD0]" },
    message: { icon: MessageSquare, tone: "bg-[#F3E8FD] text-[#8B2FD6]" },
    shield: { icon: ShieldCheck, tone: "bg-[#E7F9ED] text-[#16A34A]" },
    check: { icon: CheckCircle2, tone: "bg-[#FEECF0] text-[#E11D6B]" },
};

const { progression: t } = uiTokens;

/** Pastille de score colorée selon le niveau. */
function ScorePill({ score }: { score: number }) {
    return <Text as="span" className={cn(t.scorePill, t.level[scoreLevel(score)].pill)}>{score}%</Text>;
}

/** Badge d'évolution vert « ↗ +x% ». */
function DeltaBadge({ delta }: { delta: number }) {
    return (
        <Text as="span" className={t.delta}>
            <InlineIcon icon={ArrowUpRight} className="h-3.5 w-3.5" />
            {delta >= 0 ? "+" : ""}
            {delta}%
        </Text>
    );
}

/** Barre pleine simple, colorée par niveau (lignes d'étape). */
function LevelBar({ score }: { score: number }) {
    return (
        <Box className={cn(uiTokens.progress.track, "min-w-[110px] flex-1")}>
            <Box
                className={uiTokens.progress.fillBase}
                style={{ width: `${score}%`, backgroundColor: t.level[scoreLevel(score)].fill }}
            />
        </Box>
    );
}

/** Barre avec repère de départ (gris) + repère courant (couleur du niveau), tous deux posés sur la barre. */
function RangeBar({ current, initial }: { current: number; initial: number }) {
    const fill = t.level[scoreLevel(current)].fill;
    return (
        <Box className="relative h-3 min-w-[120px] flex-1">
            <Box className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#E5E7EB]" />
            <Box
                className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
                style={{ width: `${current}%`, backgroundColor: fill }}
            />
            <Box
                className="absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#D1D5DB] bg-white"
                style={{ left: `${initial}%` }}
            />
            <Box
                className="absolute top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white"
                style={{ left: `${current}%`, borderColor: fill }}
            />
        </Box>
    );
}

/** Repères « Initial : x% » + « Après training : y% ». */
function RangeLegend({ initial, after }: { initial: number; after: number }) {
    return (
        <>
            <Text as="span" className={t.ghostPill}>
                Initial&nbsp;: {initial}%
            </Text>
            <Text as="span" className={t.afterPill}>
                Après training&nbsp;: {after}%
            </Text>
        </>
    );
}

/** Tableau des 3 dimensions (Savoir / Savoir-faire / Savoir-être) d'une compétence. */
function DimensionTable({ competency }: { competency: ProgressCompetency }) {
    return (
        <Box className="mt-4 overflow-hidden rounded-[12px] border border-[#EEF0F4]">
            <Box className="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,2.4fr)] gap-4 bg-[#FAFAFC] px-4 py-2.5">
                <Text as="span" className={t.tableHead}>Dimension</Text>
                <Text as="span" className={t.tableHead}>Score</Text>
                <Text as="span" className={t.tableHead}>Diagnostic IA</Text>
            </Box>
            {competency.dimensions.map((dimension) => (
                <Box
                    key={dimension.key}
                    className="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,2.4fr)] items-center gap-4 border-t border-[#F1F2F5] px-4 py-3.5"
                >
                    <Box className="flex items-center gap-2">
                        <InlineIcon
                            icon={dimensionIcons[dimension.key]}
                            className={cn("h-4 w-4 shrink-0", dimensionIconColor[dimension.key])}
                        />
                        <Text as="span" className="text-[14px] font-semibold text-[#374151]">
                            {dimension.label}
                        </Text>
                    </Box>
                    <ScorePill score={dimension.score} />
                    <Text className="text-[13px] font-medium leading-5 text-[#4B5563]">{dimension.diagnostic}</Text>
                </Box>
            ))}
        </Box>
    );
}

/** Accordéon d'une compétence mobilisée (imbriqué dans une étape). */
function CompetencyAccordion({ competency }: { competency: ProgressCompetency }) {
    const [open, setOpen] = useState(false);
    return (
        <Box className={t.accordion}>
            <button type="button" onClick={() => setOpen((v) => !v)} className={cn(t.accordionHeader, "gap-4")}>
                <Box className={cn("h-2.5 w-2.5 shrink-0 rounded-full", t.level[scoreLevel(competency.score)].dot)} />
                <Text as="span" className="min-w-0 flex-1 text-[15px] font-bold text-[#111827]">
                    {competency.name}
                </Text>
                <ScorePill score={competency.score} />
                <Box className="hidden w-[150px] shrink-0 items-center lg:flex">
                    <RangeBar current={competency.score} initial={competency.initial} />
                </Box>
                <Box className="hidden items-center gap-2 md:flex">
                    <RangeLegend initial={competency.initial} after={competency.afterTraining} />
                </Box>
                <DeltaBadge delta={competency.delta} />
                <InlineIcon icon={ChevronDown} className={cn(t.chevron, open && "rotate-180")} />
            </button>
            {open && (
                <Box className="px-5 pb-5">
                    <DimensionTable competency={competency} />
                </Box>
            )}
        </Box>
    );
}

/** Accordéon d'une étape pédagogique (diagnostic + compétences mobilisées). */
function StepAccordion({ step }: { step: ProgressStep }) {
    const [open, setOpen] = useState(step.number === 1);
    const { icon, tone } = stepIcons[step.icon];
    return (
        <Box className={t.accordion}>
            <button type="button" onClick={() => setOpen((v) => !v)} className={t.accordionHeader}>
                <Box className={cn(t.iconSquare, tone)}>
                    <InlineIcon icon={icon} className="h-5 w-5" />
                </Box>
                <Text as="span" className="min-w-0 flex-1 text-[15px] font-semibold text-[#1F2937]">
                    Étape {step.number} : {step.title}
                </Text>
                <ScorePill score={step.score} />
                <Box className="hidden w-[200px] shrink-0 items-center md:flex">
                    <LevelBar score={step.score} />
                </Box>
                <DeltaBadge delta={step.delta} />
                <InlineIcon icon={ChevronDown} className={cn(t.chevron, open && "rotate-180")} />
            </button>
            {open && (
                <Box className="space-y-4 border-t border-[#F1F2F5] px-5 pb-6 pt-5">
                    <Box className={t.diagnosticBox}>
                        <Text className={t.diagnosticTitle}>Diagnostic principal IA</Text>
                        <Text className={t.diagnosticText}>{step.diagnostic}</Text>
                    </Box>
                    <Text className="text-[14px] font-bold text-[#111827]">Compétences mobilisées dans cette étape</Text>
                    <Box className="space-y-3">
                        {step.competencies.map((competency) => (
                            <CompetencyAccordion key={competency.name} competency={competency} />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
}

/** Bandeau « Score de maîtrise » avec barre initial → courant. */
function MasteryHeader({ progress }: { progress: RoleplayProgress }) {
    return (
        <Box className={t.masteryCard}>
            <Box className={t.masteryIcon}>
                <InlineIcon icon={Target} className="h-6 w-6" />
            </Box>
            <Box className="min-w-0 flex-1">
                <Text className={t.masteryLabel}>Score de maîtrise</Text>
                <Text className={t.masteryTitle}>{progress.title}</Text>
            </Box>
            <Box className="flex flex-1 items-center gap-3">
                <ScorePill score={progress.masteryScore} />
                <Box className="flex min-w-[70px] flex-1 items-center">
                    <RangeBar current={progress.masteryScore} initial={progress.initialScore} />
                </Box>
                <Box className="hidden items-center gap-3 sm:flex">
                    <RangeLegend initial={progress.initialScore} after={progress.afterTraining} />
                </Box>
                <DeltaBadge delta={progress.delta} />
            </Box>
        </Box>
    );
}

/** Résumé des 3 dimensions + accordéon des modalités d'évaluation. */
function DimensionSummary({ progress }: { progress: RoleplayProgress }) {
    const [open, setOpen] = useState(false);
    const modalityIcons = { quiz: ClipboardCheck, simulation: Phone } as const;
    const modalityTone = { quiz: "text-[#3B6FD0]", simulation: "text-[#16A34A]" } as const;
    return (
        <Box className={t.accordion}>
            <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 px-5 py-4">
                <Box className="grid flex-1 gap-3 sm:grid-cols-3">
                    {progress.dimensions.map((dimension) => (
                        <Box
                            key={dimension.key}
                            className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                        >
                            <Box className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", t.dimensionTone[dimension.key])}>
                                <InlineIcon icon={dimensionIcons[dimension.key]} className="h-4 w-4" />
                            </Box>
                            <Box className="min-w-0 flex-1">
                                <Text className="text-[14px] font-bold text-[#111827]">{dimension.label}</Text>
                                <Text className="text-[12px] font-medium text-[#9CA3AF]">{dimension.subtitle}</Text>
                            </Box>
                            <ScorePill score={dimension.score} />
                        </Box>
                    ))}
                </Box>
                <InlineIcon icon={ChevronDown} className={cn(t.chevron, open && "rotate-180")} />
            </button>
            {open && (
                <Box className="border-t border-[#F1F2F5] px-5 py-4">
                    <Box className="grid grid-cols-[minmax(0,1.4fr)_100px_minmax(0,2.6fr)] gap-4 px-1 pb-2">
                        <Text as="span" className={t.tableHead}>Modalité</Text>
                        <Text as="span" className={t.tableHead}>Score</Text>
                        <Text as="span" className={t.tableHead}>Description</Text>
                    </Box>
                    {progress.modalities.map((modality) => (
                        <Box
                            key={modality.label}
                            className="grid grid-cols-[minmax(0,1.4fr)_100px_minmax(0,2.6fr)] items-center gap-4 rounded-xl border-t border-[#F1F2F5] px-1 py-3.5 first:border-t-0"
                        >
                            <Box className="flex items-center gap-2.5">
                                <InlineIcon icon={modalityIcons[modality.icon]} className={cn("h-4 w-4 shrink-0", modalityTone[modality.icon])} />
                                <Text as="span" className="text-[14px] font-semibold text-[#374151]">{modality.label}</Text>
                            </Box>
                            <Text as="span" className="text-[14px] font-extrabold" style={{ color: t.level[scoreLevel(modality.score)].fill }}>
                                {modality.score}%
                            </Text>
                            <Text className="text-[13px] font-medium leading-5 text-[#4B5563]">{modality.description}</Text>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}

/** Onglet « Par compétences » : radar + tableau récapitulatif. */
function CompetencyOverview({ progress }: { progress: RoleplayProgress }) {
    const competencies = progressCompetencies(progress);
    return (
        <Box className="space-y-6">
            <Box className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-[#E9E7FB] bg-white px-5 py-3">
                <Box className="flex items-center gap-2">
                    <Box className="h-0.5 w-6 rounded-full bg-[#5140F0]" />
                    <Text as="span" className="text-[13px] font-semibold text-[#374151]">Score actuel</Text>
                </Box>
                <Box className="flex items-center gap-2">
                    <Box className="h-0 w-6 border-t-2 border-dashed border-[#F59E0B]" />
                    <Text as="span" className="text-[13px] font-semibold text-[#374151]">Cible ({progress.target}%)</Text>
                </Box>
            </Box>
            <Box className="flex justify-center px-4 py-10">
                <CompetencyRadarChart
                    axes={competencies.map((competency) => ({ label: competency.name, value: competency.score }))}
                    target={progress.target}
                />
            </Box>
            <Box className="overflow-hidden rounded-[14px] border border-[#EEF0F4]">
                <Box className="grid grid-cols-[minmax(0,1fr)_120px_120px] gap-4 bg-[#FAFAFC] px-5 py-3">
                    <Text as="span" className={t.tableHead}>Compétence</Text>
                    <Text as="span" className={cn(t.tableHead, "text-center")}>Score</Text>
                    <Text as="span" className={cn(t.tableHead, "text-center")}>Δ vs initial</Text>
                </Box>
                {competencies.map((competency) => (
                    <Box
                        key={competency.name}
                        className="grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-4 border-t border-[#F1F2F5] px-5 py-3.5"
                    >
                        <Box className="flex items-center gap-2.5">
                            <Box className={cn("h-2.5 w-2.5 shrink-0 rounded-full", t.level[scoreLevel(competency.score)].dot)} />
                            <Text as="span" className="text-[14px] font-semibold text-[#374151]">{competency.name}</Text>
                        </Box>
                        <Box className="flex justify-center">
                            <ScorePill score={competency.score} />
                        </Box>
                        <Box className="flex justify-center">
                            <DeltaBadge delta={competency.delta} />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export function RoleplayProgressPageContent({ backHref, progress }: RoleplayProgressPageContentProps) {
    const [tab, setTab] = useState<"steps" | "competencies">("steps");

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-6 flex items-center gap-3">
                    <Link href={backHref} aria-label="Retour" className={uiTokens.action.iconButtonGhost}>
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Text as="h1" className="text-[22px] font-bold text-[#111827]">
                        Détail de ma progression
                    </Text>
                </Box>

                <CardSurface className={uiTokens.surface.formCard}>
                    <Box className="space-y-6">
                        <MasteryHeader progress={progress} />
                        <DimensionSummary progress={progress} />

                        <Box className="flex justify-end">
                            <Box className={t.tabs}>
                                <button type="button" onClick={() => setTab("steps")} className={tab === "steps" ? t.tabActive : t.tabIdle}>
                                    Par étapes
                                </button>
                                <button type="button" onClick={() => setTab("competencies")} className={tab === "competencies" ? t.tabActive : t.tabIdle}>
                                    Par compétences
                                </button>
                            </Box>
                        </Box>

                        {tab === "steps" ? (
                            <Box className="space-y-3">
                                {progress.steps.map((step) => (
                                    <StepAccordion key={step.number} step={step} />
                                ))}
                            </Box>
                        ) : (
                            <CompetencyOverview progress={progress} />
                        )}

                        <Text className={t.footnote}>
                            Les scores sont calculés à partir de l&apos;ensemble de vos sessions de roleplay et
                            d&apos;évaluation. Δ indique l&apos;évolution depuis votre score initial.
                        </Text>
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
