"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    CalendarDays,
    Download,
    Info,
    RefreshCw,
    RotateCcw,
    UsersRound,
} from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import {
    dashboardQueryKey,
    fetchCurrentUserDashboard,
} from "@/features/dashboard/data/dashboard";
import {
    DASHBOARD_PERIOD_OPTIONS,
    type DashboardPeriodDays,
    type DashboardViewData,
} from "@/features/dashboard/domain";
import { Box, Button, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { DashboardActivityList } from "./DashboardActivityList";
import { DashboardDomainPerformance } from "./DashboardDomainPerformance";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { DashboardPerformanceChart } from "./DashboardPerformanceChart";

interface DashboardPageContentProps {
    firstName: string;
    initialDashboardData?: DashboardViewData;
}

function todayLabel(): string {
    const value = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        weekday: "long",
    }).format(new Date());
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function DashboardLoadingState() {
    return (
        <Box aria-label="Chargement du tableau de bord" aria-live="polite" className="space-y-4">
            <Box className={`${uiTokens.dashboard.panel} p-5`}>
                <Box className={`${uiTokens.dashboard.state.skeleton} h-5 w-56`} />
                <Box className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {Array.from({ length: 5 }, (_, index) => (
                        <Box className={`${uiTokens.dashboard.state.skeleton} h-[108px]`} key={index} />
                    ))}
                </Box>
                <Box className={`${uiTokens.dashboard.state.skeleton} mt-5 h-5 w-52`} />
                <Box className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }, (_, index) => (
                        <Box className={`${uiTokens.dashboard.state.skeleton} h-[108px]`} key={index} />
                    ))}
                </Box>
            </Box>
            <Box className="grid gap-4 xl:grid-cols-2">
                <Box className={`${uiTokens.dashboard.state.skeleton} h-[520px]`} />
                <Box className={`${uiTokens.dashboard.state.skeleton} h-[520px]`} />
            </Box>
        </Box>
    );
}

function DashboardErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Box className={uiTokens.dashboard.state.error} role="alert">
            <Box className={uiTokens.dashboard.state.errorIcon}>
                <InlineIcon icon={AlertTriangle} className="h-5 w-5" />
            </Box>
            <Text as="h2" className={`${uiTokens.dashboard.sectionTitle} mt-4`}>Tableau de bord indisponible</Text>
            <Text className={uiTokens.dashboard.state.errorText}>{message}</Text>
            <Button className={uiTokens.dashboard.state.retry} onClick={onRetry}>
                <InlineIcon icon={RefreshCw} className="h-4 w-4" />
                Réessayer
            </Button>
        </Box>
    );
}

export function DashboardPageContent({ firstName, initialDashboardData }: DashboardPageContentProps) {
    const [periodDays, setPeriodDays] = useState<DashboardPeriodDays>(
        initialDashboardData?.periodDays ?? 30,
    );
    const dashboardQuery = useQuery({
        initialData: initialDashboardData?.periodDays === periodDays ? initialDashboardData : undefined,
        queryFn: () => fetchCurrentUserDashboard(periodDays),
        queryKey: dashboardQueryKey(periodDays),
    });
    const dashboard = dashboardQuery.data;

    return (
        <Box as="main" className={uiTokens.dashboard.page}>
            <Box className={uiTokens.dashboard.container}>
                <Box className="flex flex-col gap-5 py-1 lg:flex-row lg:items-end lg:justify-between">
                    <Box>
                        <Text as="h1" className={uiTokens.dashboard.header.title}>
                            Bienvenue {firstName} 👋
                        </Text>
                        <Text className={uiTokens.dashboard.header.date}>{todayLabel()}</Text>
                        <Box className="mt-4 flex flex-wrap gap-3">
                            <ContextualLink className={uiTokens.dashboard.header.primaryAction} href="/roleplays">
                                <InlineIcon icon={UsersRound} className="h-4 w-4" />
                                Accéder aux roleplays
                            </ContextualLink>
                            {dashboard?.lastRoleplayHref ? (
                                <ContextualLink
                                    className={uiTokens.dashboard.header.secondaryAction}
                                    href={dashboard.lastRoleplayHref}
                                >
                                    <InlineIcon icon={RotateCcw} className="h-4 w-4" />
                                    Rejouer mon dernier roleplay
                                </ContextualLink>
                            ) : (
                                <Button className={uiTokens.dashboard.header.secondaryAction} disabled>
                                    <InlineIcon icon={RotateCcw} className="h-4 w-4" />
                                    Aucun roleplay à rejouer
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Box className="flex flex-wrap items-center gap-3">
                        <Tooltip content="La période change l’activité et les scores affichés. Les éléments à faire restent calculés sur tout votre historique.">
                            <span className="inline-flex">
                                <InlineIcon icon={Info} className={uiTokens.dashboard.header.infoIcon} />
                            </span>
                        </Tooltip>
                        <label className="relative">
                            <span className="sr-only">Période d’affichage</span>
                            <select
                                aria-label="Période d’affichage"
                                className={uiTokens.dashboard.header.periodControl}
                                onChange={(event) => setPeriodDays(Number(event.target.value) as DashboardPeriodDays)}
                                value={periodDays}
                            >
                                {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        Période d’affichage {option.label}
                                    </option>
                                ))}
                            </select>
                            <InlineIcon icon={CalendarDays} className={uiTokens.dashboard.header.periodIcon} />
                        </label>
                        <Button className={uiTokens.dashboard.header.secondaryAction} onClick={() => window.print()}>
                            <InlineIcon icon={Download} className="h-4 w-4" />
                            Exporter PDF
                        </Button>
                        {dashboardQuery.isFetching && !dashboardQuery.isPending && (
                            <Text aria-live="polite" className={uiTokens.dashboard.header.fetching}>
                                Actualisation…
                            </Text>
                        )}
                    </Box>
                </Box>

                {dashboardQuery.isPending ? (
                    <DashboardLoadingState />
                ) : dashboardQuery.isError || !dashboard ? (
                    <DashboardErrorState
                        message={dashboardQuery.error instanceof Error
                            ? dashboardQuery.error.message
                            : "Impossible de charger votre tableau de bord."}
                        onRetry={() => void dashboardQuery.refetch()}
                    />
                ) : (
                    <>
                        <Box className={`${uiTokens.dashboard.panel} p-5`}>
                            <Text as="h2" className={uiTokens.dashboard.sectionTitle}>Activité roleplay &amp; scénarios</Text>
                            <Box className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                {dashboard.activity.roleplays.map((metric) => (
                                    <DashboardMetricCard key={metric.id} metric={metric} />
                                ))}
                            </Box>

                            <Text as="h2" className={`${uiTokens.dashboard.sectionTitle} mt-5`}>Activité quiz &amp; connaissances</Text>
                            <Box className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {dashboard.activity.quizzes.map((metric) => (
                                    <DashboardMetricCard key={metric.id} metric={metric} />
                                ))}
                            </Box>
                        </Box>

                        <Box className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                            <Box className={`${uiTokens.dashboard.panel} p-5`}>
                                <Text as="h2" className={`${uiTokens.dashboard.sectionTitle} mb-4`}>Performance synthétique</Text>
                                <DashboardPerformanceChart snapshot={dashboard.performance} />
                            </Box>

                            <Box className={`${uiTokens.dashboard.panel} flex min-h-0 flex-col p-5`}>
                                <Text as="h2" className={`${uiTokens.dashboard.sectionTitle} mb-4`}>Performance par domaine</Text>
                                <Box className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
                                    <DashboardDomainPerformance
                                        groups={dashboard.domainPerformance.roleplays}
                                        scoreLabel="Score moyen roleplay"
                                    />
                                    <DashboardDomainPerformance
                                        groups={dashboard.domainPerformance.quizzes}
                                        scoreLabel="Score moyen quiz"
                                    />
                                </Box>
                                <Box className={uiTokens.dashboard.chart.footnote}>
                                    <Tooltip content="Le score d’un domaine est la moyenne des meilleurs scores de ses activités.">
                                        <span className="inline-flex">
                                            <InlineIcon icon={Info} className="mt-0.5 h-3.5 w-3.5" />
                                        </span>
                                    </Tooltip>
                                    <Text>
                                        Les moyennes utilisent le meilleur score de chaque roleplay ou quiz distinct sur la période sélectionnée.
                                    </Text>
                                </Box>
                            </Box>
                        </Box>

                        <Box className="grid gap-4 xl:grid-cols-2">
                            <DashboardActivityList collection={dashboard.roleplays} kind="roleplay" />
                            <DashboardActivityList collection={dashboard.quizzes} kind="quiz" />
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
