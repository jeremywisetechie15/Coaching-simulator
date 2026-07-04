"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileText,
    MessageSquare,
    Pencil,
    Phone,
    ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Fragment, useState } from "react";
import {
    getScorecardStepPoints,
    getScorecardViewStats,
    SCORECARD_CRITERION_DIMENSION_LABELS,
    SCORECARD_ROUTES,
    type ScorecardDetailView,
    type ScorecardStepView,
} from "@/features/scorecards/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const stepGlyphs: LucideIcon[] = [Phone, MessageSquare, ShieldCheck, CheckCircle2];

function plural(count: number, singular: string, plural: string) {
    return count > 1 ? plural : singular;
}

function ScorecardStepAccordion({ index, step }: { index: number; step: ScorecardStepView }) {
    const [open, setOpen] = useState(index === 0);
    const glyph = stepGlyphs[index % stepGlyphs.length];
    const tone = uiTokens.scorecard.stepTones[index % uiTokens.scorecard.stepTones.length];
    const points = getScorecardStepPoints(step);
    const criteriaCount = step.criteria.length;

    return (
        <CardSurface className={uiTokens.scorecard.stepCard}>
            <Button
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className={uiTokens.scorecard.stepHeader}
            >
                <Box className={cn(uiTokens.scorecard.stepIcon, tone)}>
                    <InlineIcon icon={glyph} className="h-5 w-5" />
                </Box>
                <Text as="h3" className={uiTokens.scorecard.stepTitle}>
                    {step.title}
                </Text>
                <Text as="span" className={uiTokens.scorecard.stepMeta}>
                    {points} pts · {criteriaCount} {plural(criteriaCount, "critère", "critères")}
                </Text>
                <InlineIcon icon={ChevronDown} className={cn(uiTokens.scorecard.stepChevron, open && "rotate-180")} />
            </Button>

            {open && (
                <Box className="overflow-x-auto">
                    <Box className="min-w-[820px]">
                        <Box className={cn(uiTokens.scorecard.tableHeader, uiTokens.scorecard.criteriaGrid)}>
                            <Text as="span">Critère clé</Text>
                            <Text as="span">Compétence</Text>
                            <Text as="span">Dimension</Text>
                            <Text as="span" className="text-center">
                                Pts
                            </Text>
                            <Text as="span">Preuves attendues</Text>
                            <Text as="span">Exemples et verbatims</Text>
                        </Box>

                        {step.criteria.map((criterion) => (
                            <Box
                                key={criterion.id}
                                className={cn(uiTokens.scorecard.tableRow, uiTokens.scorecard.criteriaGrid)}
                            >
                                <Text className={uiTokens.scorecard.criterionKey}>{criterion.key}</Text>
                                <Text className={uiTokens.scorecard.criterionMeta}>{criterion.competenceName}</Text>
                                <Text className={uiTokens.scorecard.criterionMeta}>
                                    {SCORECARD_CRITERION_DIMENSION_LABELS[criterion.dimension]}
                                </Text>
                                <Box className="flex justify-center">
                                    <Text as="span" className={uiTokens.scorecard.ptsBadge}>
                                        {criterion.maxPoints}
                                    </Text>
                                </Box>
                                <Text className={uiTokens.scorecard.criterionEvidence}>
                                    {criterion.expectedEvidence}
                                </Text>
                                <Box className={uiTokens.scorecard.verbatimBox}>{criterion.verbatim}</Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </CardSurface>
    );
}

export function ScorecardDetailPageContent({
    canManage = false,
    scorecard,
}: {
    canManage?: boolean;
    scorecard: ScorecardDetailView;
}) {
    const stats = getScorecardViewStats(scorecard);
    const statItems = [
        { label: plural(stats.stepCount, "étape", "étapes"), value: stats.stepCount },
        { label: plural(stats.criteriaCount, "critère", "critères"), value: stats.criteriaCount },
        { label: "points", value: stats.totalPoints },
        {
            label: plural(stats.competenceCount, "compétence évaluée", "compétences évaluées"),
            value: stats.competenceCount,
        },
    ];

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Link href={SCORECARD_ROUTES.app.collection} className={uiTokens.action.backLink}>
                        <InlineIcon icon={ArrowLeft} className="h-4 w-4" />
                        Retour aux scorecards
                    </Link>
                    {canManage && (
                        <Link
                            href={SCORECARD_ROUTES.app.edit(scorecard.id)}
                            className={cn(
                                "flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-bold text-white transition",
                                uiTokens.action.primaryButton,
                            )}
                        >
                            <InlineIcon icon={Pencil} className="h-4 w-4" />
                            Modifier
                        </Link>
                    )}
                </Box>

                <CardSurface className={uiTokens.surface.formCard}>
                    <Text as="h1" className={cn("text-[28px] font-extrabold md:text-[32px]", uiTokens.text.heading)}>
                        {scorecard.name}
                    </Text>
                    <Text className={cn("mt-4 text-[14px] font-medium leading-7", uiTokens.text.body)}>
                        {scorecard.description}
                    </Text>

                    <Box className="mt-5">
                        <Box className={uiTokens.scorecard.statsBox}>
                            {statItems.map((item, index) => (
                                <Fragment key={item.label}>
                                    {index > 0 && (
                                        <Text as="span" className={uiTokens.scorecard.statDivider}>
                                            ·
                                        </Text>
                                    )}
                                    <Text as="span">
                                        <Text as="span" className={uiTokens.scorecard.statValue}>
                                            {item.value}
                                        </Text>{" "}
                                        <Text as="span" className={uiTokens.scorecard.statLabel}>
                                            {item.label}
                                        </Text>
                                    </Text>
                                </Fragment>
                            ))}
                        </Box>
                    </Box>

                    <Box className="mt-4 flex flex-wrap gap-3">
                        <Box className={uiTokens.scorecard.metaChip}>
                            <InlineIcon icon={Clock} className={uiTokens.scorecard.metaChipIcon} />
                            Niveau : {scorecard.level}
                        </Box>
                        <Box className={uiTokens.scorecard.metaChip}>
                            <InlineIcon icon={FileText} className={uiTokens.scorecard.metaChipIcon} />
                            Méthode associée : {scorecard.methodName}
                        </Box>
                    </Box>

                    <Text as="h2" className={cn("mt-7 text-[18px] font-extrabold", uiTokens.text.heading)}>
                        Les {stats.stepCount} {plural(stats.stepCount, "étape", "étapes")} de la scorecard
                    </Text>
                    <Box className="mt-3 space-y-3">
                        {scorecard.steps.map((step, index) => (
                            <ScorecardStepAccordion key={step.id} index={index} step={step} />
                        ))}
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
