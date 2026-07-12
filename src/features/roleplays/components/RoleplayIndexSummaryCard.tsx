"use client";

import { useState } from "react";
import { ChartNoAxesColumnIncreasing, Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
    getRoleplayIndexTrend,
    ROLEPLAY_INDEX_BEST_SESSION_COUNT,
    ROLEPLAY_INDEX_RECENT_SESSION_LIMIT,
    type RoleplayIndexSession,
    type RoleplayIndexTrend,
} from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { Drawer } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RoleplayIndexSummaryCardProps {
    delta: number | null;
    score: number | null;
    sessions: RoleplayIndexSession[];
    sessionCount: number;
    trend?: RoleplayIndexTrend;
}

function getTrendPresentation(trend: RoleplayIndexTrend, delta: number | null, sessionCount: number) {
    if (trend === "up") {
        return { className: uiTokens.text.success, icon: TrendingUp, label: `Évolution +${delta}%` };
    }

    if (trend === "down") {
        return { className: uiTokens.text.danger, icon: TrendingDown, label: `Baisse ${delta}%` };
    }

    if (trend === "stable") {
        return { className: uiTokens.text.muted, icon: Minus, label: "INDEX stabilisé" };
    }

    return {
        className: uiTokens.text.muted,
        icon: Minus,
        label: sessionCount > 0 ? "Première mesure" : "Aucune mesure",
    };
}

function formatSessionDate(value: string | null) {
    if (!value) return "Date inconnue";

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        timeZone: "Europe/Paris",
    }).format(new Date(value));
}

export function RoleplayIndexSummaryCard({ delta, score, sessions, sessionCount, trend }: RoleplayIndexSummaryCardProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const resolvedTrend = trend ?? getRoleplayIndexTrend(delta);
    const presentation = getTrendPresentation(resolvedTrend, delta, sessionCount);
    const chartSessions = sessions.slice().reverse();
    const indexCurvePoints = chartSessions
        .map((session, position) => {
            const x = ((position + 0.5) / chartSessions.length) * 100;
            return `${x},${100 - session.indexScore}`;
        })
        .join(" ");

    return (
        <>
            <CardSurface className={uiTokens.roleplayIndex.card}>
                <Box className="flex items-center justify-center gap-1.5">
                    <InlineIcon icon={ChartNoAxesColumnIncreasing} className={uiTokens.roleplayIndex.titleIcon} />
                    <Text className={uiTokens.roleplayIndex.title}>Mon INDEX</Text>
                    <Tooltip content="Comprendre mon INDEX">
                        <Button
                            aria-label="Comprendre mon INDEX"
                            onClick={() => setIsDrawerOpen(true)}
                            className={uiTokens.roleplayIndex.infoButton}
                        >
                            <InlineIcon icon={Info} className="h-3.5 w-3.5" />
                        </Button>
                    </Tooltip>
                </Box>
                <Text className={uiTokens.roleplayIndex.score}>{score === null ? "--" : `${score}%`}</Text>
                <Box className={cn(uiTokens.roleplayIndex.trend, presentation.className)}>
                    <InlineIcon icon={presentation.icon} className="h-3.5 w-3.5 shrink-0" />
                    <Text as="span">{presentation.label}</Text>
                </Box>
            </CardSurface>

            {isDrawerOpen && (
                <Drawer
                    title="Mon INDEX"
                    description="Synthèse de vos performances récentes"
                    onClose={() => setIsDrawerOpen(false)}
                >
                    <Box className="space-y-4">
                        <Box className={uiTokens.roleplayIndex.chartCard}>
                            <Box className={uiTokens.roleplayIndex.chartHeader}>
                                <Box>
                                    <Text className={uiTokens.roleplayIndex.drawerLabel}>INDEX actuel</Text>
                                    <Text className={uiTokens.roleplayIndex.chartIndexScore}>
                                        {score === null ? "--" : `${score}%`}
                                    </Text>
                                </Box>
                                <Box className={cn(uiTokens.roleplayIndex.drawerTrend, presentation.className)}>
                                    <InlineIcon icon={presentation.icon} className="h-4 w-4 shrink-0" />
                                    <Text as="span">{presentation.label}</Text>
                                </Box>
                            </Box>

                            {sessions.length > 0 ? (
                                <Box className="mt-5">
                                    <Text className={uiTokens.roleplayIndex.chartTitle}>
                                        {ROLEPLAY_INDEX_RECENT_SESSION_LIMIT} dernières simulations notées
                                    </Text>
                                    <Box
                                        aria-label={`Scores des ${ROLEPLAY_INDEX_RECENT_SESSION_LIMIT} dernières simulations et évolution de l'INDEX`}
                                        className={uiTokens.roleplayIndex.chartPlot}
                                        role="group"
                                    >
                                        <Box
                                            className={uiTokens.roleplayIndex.chartColumns}
                                            style={{ gridTemplateColumns: `repeat(${chartSessions.length}, minmax(0, 1fr))` }}
                                        >
                                            {chartSessions.map((session) => (
                                                <Box
                                                    key={session.sessionId}
                                                    className={uiTokens.roleplayIndex.chartColumn}
                                                    title={`${formatSessionDate(session.completedAt)} : ${session.score}%`}
                                                >
                                                    <Text
                                                        className={uiTokens.roleplayIndex.chartBarValue}
                                                        style={{ bottom: `${Math.min(session.score, 94)}%` }}
                                                    >
                                                        {session.score}%
                                                    </Text>
                                                    <Box
                                                        className={
                                                            session.isTopScore
                                                                ? uiTokens.roleplayIndex.chartBarTop
                                                                : uiTokens.roleplayIndex.chartBarOther
                                                        }
                                                        style={{ height: `${session.score}%` }}
                                                    />
                                                </Box>
                                            ))}
                                        </Box>
                                        <svg
                                            aria-hidden="true"
                                            className={uiTokens.roleplayIndex.chartIndexCurve}
                                            preserveAspectRatio="none"
                                            viewBox="0 0 100 100"
                                        >
                                            <polyline
                                                fill="none"
                                                points={indexCurvePoints}
                                                stroke="currentColor"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        </svg>
                                        <Box
                                            className={uiTokens.roleplayIndex.chartIndexPoints}
                                            style={{ gridTemplateColumns: `repeat(${chartSessions.length}, minmax(0, 1fr))` }}
                                        >
                                            {chartSessions.map((session, position) => (
                                                <Box key={session.sessionId} className="relative h-full">
                                                    <Button
                                                        aria-label={`INDEX ${session.indexScore}%`}
                                                        className={uiTokens.roleplayIndex.chartIndexPoint}
                                                        style={{ bottom: `${session.indexScore}%` }}
                                                    >
                                                        <Text
                                                            as="span"
                                                            className={cn(
                                                                uiTokens.roleplayIndex.chartIndexPointValue,
                                                                position === chartSessions.length - 1 &&
                                                                    uiTokens.roleplayIndex.chartIndexPointValueVisible,
                                                            )}
                                                        >
                                                            {session.indexScore}%
                                                        </Text>
                                                    </Button>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                    <Box
                                        className={uiTokens.roleplayIndex.chartDates}
                                        style={{ gridTemplateColumns: `repeat(${chartSessions.length}, minmax(0, 1fr))` }}
                                    >
                                        {chartSessions.map((session) => (
                                            <Text key={session.sessionId} className={uiTokens.roleplayIndex.chartDate}>
                                                {formatSessionDate(session.completedAt)}
                                            </Text>
                                        ))}
                                    </Box>

                                    <Box className={uiTokens.roleplayIndex.chartLegend}>
                                        <Box className="inline-flex items-center gap-1.5">
                                            <Box className={uiTokens.roleplayIndex.chartLegendTopDot} />
                                            <Text as="span">
                                                {ROLEPLAY_INDEX_BEST_SESSION_COUNT} meilleures performances
                                            </Text>
                                        </Box>
                                        <Box className="inline-flex items-center gap-1.5">
                                            <Box className={uiTokens.roleplayIndex.chartLegendOtherDot} />
                                            <Text as="span">Autres scores notés</Text>
                                        </Box>
                                        <Box className="inline-flex items-center gap-1.5">
                                            <Box className={uiTokens.roleplayIndex.chartLegendIndexCurve} />
                                            <Text as="span">Évolution de l&apos;INDEX</Text>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : (
                                <Box className={uiTokens.roleplayIndex.chartEmpty}>
                                    Le graphique apparaîtra après votre première simulation notée.
                                </Box>
                            )}
                        </Box>

                        <Box className={uiTokens.roleplayIndex.definitionCard}>
                            <Text className={uiTokens.roleplayIndex.definitionTitle}>Règle de calcul</Text>
                            <Text className={uiTokens.roleplayIndex.definitionText}>
                                Moyenne des {ROLEPLAY_INDEX_BEST_SESSION_COUNT} meilleurs scores obtenus parmi vos{" "}
                                {ROLEPLAY_INDEX_RECENT_SESSION_LIMIT} dernières simulations notées.
                            </Text>
                        </Box>
                    </Box>
                </Drawer>
            )}
        </>
    );
}
