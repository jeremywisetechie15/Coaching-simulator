"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ADMIN_DASHBOARD_AI_OVERVIEW_HELP,
    ADMIN_DASHBOARD_FEATURES,
    ADMIN_DASHBOARD_ORGANIZATION_ALL,
    formatAdminDashboardDuration,
    type AdminDashboardOrganizationFilter,
    type AdminDashboardPeriodDays,
    type AdminDashboardViewData,
} from "@/features/admin-dashboard/domain";
import {
    adminDashboardQueryKey,
    fetchAdminDashboard,
} from "@/features/admin-dashboard/data";
import { ContextualLink } from "@/features/app-shell/components";
import { DASHBOARD_PERIOD_OPTIONS } from "@/features/dashboard/domain";
import { APP_TIME_ZONE } from "@/lib/date/format-date-time";
import { Box, Button, CardSurface, InlineIcon, SelectInput, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { AdminDashboardActivityChart } from "./AdminDashboardActivityChart";
import {
    adminDashboardAiIcons,
    adminDashboardControlIcons,
} from "./AdminDashboardIcons";
import { AdminDashboardMetricCard } from "./AdminDashboardMetricCard";
import { AdminDashboardStatCard } from "./AdminDashboardStatCard";

interface AdminDashboardPageContentProps {
    firstName: string;
    initialDashboardData?: AdminDashboardViewData;
}

const headerDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
    weekday: "long",
});

function formatHeaderDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const label = headerDateFormatter.format(date);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function SectionHeader({ action, title }: { action?: ReactNode; title: string }) {
    return (
        <Box className={uiTokens.adminDashboard.sectionHeader}>
            <Text as="h2" className={uiTokens.adminDashboard.sectionTitle}>{title}</Text>
            {action}
        </Box>
    );
}

function LoadingState() {
    return (
        <Box aria-label="Chargement du dashboard administrateur" className={uiTokens.adminDashboard.loading.layout}>
            <Box className={uiTokens.adminDashboard.loading.summary}>
                <Box className={uiTokens.adminDashboard.summary.metricsGrid}>
                    {Array.from({ length: 6 }, (_, index) => (
                        <Box className={`${uiTokens.adminDashboard.state.skeleton} h-28`} key={index} />
                    ))}
                </Box>
                <Box className={uiTokens.adminDashboard.loading.aiGrid}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <Box className={`${uiTokens.adminDashboard.state.skeleton} h-28`} key={index} />
                    ))}
                </Box>
            </Box>
            <Box className={uiTokens.adminDashboard.layout.middle}>
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[390px]`} />
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[390px]`} />
            </Box>
            <Box className={uiTokens.adminDashboard.layout.bottom}>
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[300px]`} />
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[300px]`} />
            </Box>
        </Box>
    );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <Box className={uiTokens.adminDashboard.state.error} role="alert">
            <Text as="h2" className={uiTokens.adminDashboard.sectionTitle}>Dashboard administrateur indisponible</Text>
            <Text className={uiTokens.adminDashboard.state.errorText}>{message}</Text>
            <Button className={`${uiTokens.adminDashboard.header.button} mt-4`} onClick={onRetry}>
                <InlineIcon icon={adminDashboardControlIcons.refresh} className="h-4 w-4" />
                Réessayer
            </Button>
        </Box>
    );
}

function scoreClass(score: number | null) {
    if (score === null || score >= 75) return uiTokens.adminDashboard.table.scoreGood;
    if (score < 50) return uiTokens.adminDashboard.table.scoreDanger;
    return uiTokens.adminDashboard.table.scoreWarning;
}

function scoreLabel(score: number | null) {
    return score === null ? "-" : `${Math.round(score)}%`;
}

function AiOverview({ dashboard }: { dashboard: AdminDashboardViewData }) {
    if (!ADMIN_DASHBOARD_FEATURES.aiUsage) return null;

    return (
        <>
            <Text as="h2" className={uiTokens.adminDashboard.summary.aiTitle}>Usage des interactions IA</Text>
            <Box className={uiTokens.adminDashboard.summary.aiGrid}>
                {dashboard.aiUsage.overview.map((item) => (
                    <AdminDashboardStatCard
                        detail={item.detail}
                        help={ADMIN_DASHBOARD_AI_OVERVIEW_HELP[item.id]}
                        icon={adminDashboardAiIcons[item.id]}
                        key={item.id}
                        label={item.label}
                        tone={item.tone}
                        value={item.value}
                    />
                ))}
            </Box>
        </>
    );
}

function AiOrganizationUsage({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={uiTokens.adminDashboard.panelContent}>
            <SectionHeader
                action={<ContextualLink className={uiTokens.adminDashboard.table.viewAll} href="/organizations">Voir toutes</ContextualLink>}
                title="Interactions IA par organisation"
            />
            <Box className={uiTokens.adminDashboard.table.scrollArea}>
                <Box className={`${uiTokens.adminDashboard.ai.table} ${uiTokens.adminDashboard.ai.tableMinWidth}`}>
                    <Box className={uiTokens.adminDashboard.ai.header}>
                        <span>Organisation</span><span>Learners actifs</span><span>Simulations IA</span><span>Ask IA persona</span><span>Coach IA</span><span>Total IA</span>
                    </Box>
                    {dashboard.aiUsage.organizations.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucune organisation active.</Box>
                    ) : dashboard.aiUsage.organizations.map((organization) => (
                        <Box className={uiTokens.adminDashboard.ai.row} key={organization.id}>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={`/organizations/${organization.id}`}>
                                {organization.name}
                            </ContextualLink>
                            <Text>{organization.activeLearnerCount}</Text>
                            <Text>{formatAdminDashboardDuration(organization.simulationSeconds)}</Text>
                            <Text>{formatAdminDashboardDuration(organization.askPersonaSeconds)}</Text>
                            <Text>{formatAdminDashboardDuration(organization.coachSeconds)}</Text>
                            <Text className={uiTokens.adminDashboard.table.strong}>{formatAdminDashboardDuration(organization.totalSeconds)}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

function PlatformActivity({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={uiTokens.adminDashboard.panelContent}>
            <SectionHeader title="Activité de la plateforme" />
            <AdminDashboardActivityChart data={dashboard.activity} />
            <Box className={uiTokens.adminDashboard.chart.footnote}>
                <Tooltip content="Chaque point indique le nombre de connexions réussies, de roleplays éligibles et de quiz terminés pendant l’intervalle.">
                    <span className="inline-flex">
                        <InlineIcon icon={adminDashboardControlIcons.info} className="h-3.5 w-3.5" />
                    </span>
                </Tooltip>
                <Text>Les données reflètent la période sélectionnée.</Text>
            </Box>
        </CardSurface>
    );
}

function TopRoleplays({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={uiTokens.adminDashboard.panelContent}>
            <SectionHeader
                action={<ContextualLink className={uiTokens.adminDashboard.table.viewAll} href="/roleplays">Voir tous</ContextualLink>}
                title="Top roleplays joués"
            />
            <Box className={uiTokens.adminDashboard.table.scrollArea}>
                <Box className={`${uiTokens.adminDashboard.table.root} ${uiTokens.adminDashboard.table.topRoleplaysMinWidth}`}>
                    <Box className={`${uiTokens.adminDashboard.table.header} ${uiTokens.adminDashboard.table.topRoleplaysColumns}`}>
                        <span /><span>Roleplay</span><span>Apprenants</span><span>Sessions</span><span>Temps passé</span>
                    </Box>
                    {dashboard.topRoleplays.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucun roleplay terminé sur cette période.</Box>
                    ) : dashboard.topRoleplays.map((roleplay, index) => (
                        <Box className={`${uiTokens.adminDashboard.table.row} ${uiTokens.adminDashboard.table.topRoleplaysColumns}`} key={roleplay.id}>
                            <Box className={uiTokens.adminDashboard.table.rank}>{index + 1}</Box>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={`/roleplays/${roleplay.id}`}>
                                {roleplay.title}
                            </ContextualLink>
                            <Text className={uiTokens.adminDashboard.table.centerStrong}>{roleplay.learnerCount}</Text>
                            <Text className={uiTokens.adminDashboard.table.centerStrong}>{roleplay.sessionCount}</Text>
                            <Text className={uiTokens.adminDashboard.table.rightStrong}>{formatAdminDashboardDuration(roleplay.durationSeconds)}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

function OrganizationPerformance({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={uiTokens.adminDashboard.panelContent}>
            <SectionHeader
                action={<ContextualLink className={uiTokens.adminDashboard.table.viewAll} href="/organizations">Voir toutes</ContextualLink>}
                title="Performance par organisation"
            />
            <Box className={uiTokens.adminDashboard.table.scrollArea}>
                <Box className={`${uiTokens.adminDashboard.table.root} ${uiTokens.adminDashboard.table.performanceMinWidth}`}>
                    <Box className={`${uiTokens.adminDashboard.table.header} ${uiTokens.adminDashboard.table.performanceColumns}`}>
                        <span>Organisation</span><span>Learners actifs</span><span>Score roleplay</span><span>Score quiz</span>
                    </Box>
                    {dashboard.organizationPerformance.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucune performance disponible.</Box>
                    ) : dashboard.organizationPerformance.map((organization) => (
                        <Box className={`${uiTokens.adminDashboard.table.row} ${uiTokens.adminDashboard.table.performanceColumns}`} key={organization.id}>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={`/organizations/${organization.id}`}>
                                {organization.name}
                            </ContextualLink>
                            <Text className={uiTokens.adminDashboard.table.centerStrong}>{organization.activeLearnerCount}</Text>
                            <Text className={scoreClass(organization.roleplayScore)}>{scoreLabel(organization.roleplayScore)}</Text>
                            <Text className={scoreClass(organization.quizScore)}>{scoreLabel(organization.quizScore)}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

export function AdminDashboardPageContent({
    firstName,
    initialDashboardData,
}: AdminDashboardPageContentProps) {
    const [periodDays, setPeriodDays] = useState<AdminDashboardPeriodDays>(
        initialDashboardData?.periodDays ?? 30,
    );
    const [organizationFilter, setOrganizationFilter] = useState<AdminDashboardOrganizationFilter>(
        initialDashboardData?.organizationFilter ?? ADMIN_DASHBOARD_ORGANIZATION_ALL,
    );
    const dashboardQuery = useQuery({
        initialData:
            initialDashboardData?.periodDays === periodDays
            && initialDashboardData.organizationFilter === organizationFilter
                ? initialDashboardData
                : undefined,
        queryFn: () => fetchAdminDashboard(periodDays, organizationFilter),
        queryKey: adminDashboardQueryKey(periodDays, organizationFilter),
    });
    const dashboard = dashboardQuery.data;
    const generatedAt = dashboard?.generatedAt ?? initialDashboardData?.generatedAt ?? new Date().toISOString();

    return (
        <Box as="main" className={uiTokens.adminDashboard.page}>
            <Box className={uiTokens.adminDashboard.container}>
                <Box className={uiTokens.adminDashboard.header.layout}>
                    <Box>
                        <Text as="h1" className={uiTokens.adminDashboard.header.title}>
                            Bienvenue {firstName || "Admin"} 👋
                        </Text>
                        <Text className={uiTokens.adminDashboard.header.date}>{formatHeaderDate(generatedAt)}</Text>
                    </Box>
                    <Box className={uiTokens.adminDashboard.header.controls}>
                        <label className={uiTokens.adminDashboard.header.controlWrapper}>
                            <span className="sr-only">Période d’affichage</span>
                            <SelectInput
                                aria-label="Période d’affichage"
                                className={uiTokens.adminDashboard.header.periodSelect}
                                density="sm"
                                onChange={(event) => setPeriodDays(Number(event.target.value) as AdminDashboardPeriodDays)}
                                value={periodDays}
                            >
                                {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>Période d’affichage {option.label}</option>
                                ))}
                            </SelectInput>
                            <InlineIcon icon={adminDashboardControlIcons.calendar} className={uiTokens.adminDashboard.header.selectIcon} />
                            <InlineIcon icon={adminDashboardControlIcons.chevron} className={uiTokens.adminDashboard.header.chevron} />
                        </label>
                        <Button className={uiTokens.adminDashboard.header.button} onClick={() => window.print()}>
                            <InlineIcon icon={adminDashboardControlIcons.download} className="h-4 w-4" />
                            Exporter PDF
                        </Button>
                        <label className={uiTokens.adminDashboard.header.controlWrapper}>
                            <span className="sr-only">Filtrer par organisation</span>
                            <SelectInput
                                aria-label="Filtrer par organisation"
                                className={uiTokens.adminDashboard.header.organizationSelect}
                                density="sm"
                                onChange={(event) => setOrganizationFilter(event.target.value)}
                                value={organizationFilter}
                            >
                                <option value={ADMIN_DASHBOARD_ORGANIZATION_ALL}>Toutes les organisations</option>
                                {(dashboard?.organizations ?? initialDashboardData?.organizations ?? []).map((organization) => (
                                    <option key={organization.id} value={organization.id}>{organization.name}</option>
                                ))}
                            </SelectInput>
                            <InlineIcon icon={adminDashboardControlIcons.chevron} className={uiTokens.adminDashboard.header.chevron} />
                        </label>
                    </Box>
                </Box>

                {dashboardQuery.isPending ? (
                    <LoadingState />
                ) : dashboardQuery.isError || !dashboard ? (
                    <ErrorState
                        message={dashboardQuery.error instanceof Error
                            ? dashboardQuery.error.message
                            : "Impossible de charger le dashboard administrateur."}
                        onRetry={() => void dashboardQuery.refetch()}
                    />
                ) : (
                    <>
                        <CardSurface className={uiTokens.adminDashboard.summary.panel}>
                            <Box className={uiTokens.adminDashboard.summary.metricsGrid}>
                                {dashboard.metrics.map((metric) => (
                                    <AdminDashboardMetricCard key={metric.id} metric={metric} />
                                ))}
                            </Box>
                            <AiOverview dashboard={dashboard} />
                        </CardSurface>

                        <Box className={uiTokens.adminDashboard.layout.middle}>
                            <PlatformActivity dashboard={dashboard} />
                            {ADMIN_DASHBOARD_FEATURES.aiUsage && <AiOrganizationUsage dashboard={dashboard} />}
                        </Box>

                        <Box className={uiTokens.adminDashboard.layout.bottom}>
                            <TopRoleplays dashboard={dashboard} />
                            <OrganizationPerformance dashboard={dashboard} />
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
}
