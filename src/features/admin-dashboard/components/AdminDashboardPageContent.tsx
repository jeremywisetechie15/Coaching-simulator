"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ADMIN_DASHBOARD_FEATURES,
    ADMIN_DASHBOARD_ORGANIZATION_ALL,
    ADMIN_DASHBOARD_QUICK_ACTIONS,
    formatAdminDashboardDuration,
    type AdminDashboardOrganizationFilter,
    type AdminDashboardPeriodDays,
    type AdminDashboardTone,
    type AdminDashboardViewData,
} from "@/features/admin-dashboard/domain";
import {
    adminDashboardQueryKey,
    fetchAdminDashboard,
} from "@/features/admin-dashboard/data";
import { ContextualLink } from "@/features/app-shell/components";
import { CONTENT_STATUS_LABELS } from "@/features/content/domain";
import { DASHBOARD_PERIOD_OPTIONS } from "@/features/dashboard/domain";
import { Box, Button, CardSurface, InlineIcon, SelectInput, Text, Tooltip } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { AdminDashboardActivityChart } from "./AdminDashboardActivityChart";
import {
    adminDashboardActivityIcons,
    adminDashboardAiIcons,
    adminDashboardControlIcons,
    adminDashboardQuickActionIcons,
} from "./AdminDashboardIcons";
import { AdminDashboardMetricCard } from "./AdminDashboardMetricCard";

interface AdminDashboardPageContentProps {
    initialDashboardData?: AdminDashboardViewData;
}

function SectionHeader({
    action,
    subtitle,
    title,
}: {
    action?: ReactNode;
    subtitle?: string;
    title: string;
}) {
    return (
        <Box className="flex flex-wrap items-start justify-between gap-3">
            <Box>
                <Box className="flex flex-wrap items-center gap-2">
                    <Text as="h2" className={uiTokens.adminDashboard.sectionTitle}>{title}</Text>
                </Box>
                {subtitle && <Text className={uiTokens.adminDashboard.sectionSubtitle}>{subtitle}</Text>}
            </Box>
            {action}
        </Box>
    );
}

function PeriodTabs({
    periodDays,
    setPeriodDays,
}: {
    periodDays: AdminDashboardPeriodDays;
    setPeriodDays: (period: AdminDashboardPeriodDays) => void;
}) {
    return (
        <Box aria-label="Période du graphique" className={uiTokens.adminDashboard.periodTabs.root} role="group">
            {DASHBOARD_PERIOD_OPTIONS.map((option) => (
                <Button
                    aria-pressed={periodDays === option.value}
                    className={cn(
                        uiTokens.adminDashboard.periodTabs.button,
                        periodDays === option.value
                            ? uiTokens.adminDashboard.periodTabs.active
                            : uiTokens.adminDashboard.periodTabs.idle,
                    )}
                    key={option.value}
                    onClick={() => setPeriodDays(option.value)}
                >
                    {option.value}j
                </Button>
            ))}
        </Box>
    );
}

function LoadingState() {
    return (
        <Box className="space-y-3.5" aria-label="Chargement du dashboard administrateur">
            <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: 6 }, (_, index) => (
                    <Box className={`${uiTokens.adminDashboard.state.skeleton} h-28`} key={index} />
                ))}
            </Box>
            <Box className="grid gap-3.5 xl:grid-cols-[1.35fr_1fr]">
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[330px]`} />
                <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[330px]`} />
            </Box>
            <Box className={`${uiTokens.adminDashboard.state.skeleton} h-[250px]`} />
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

function QuickActions() {
    return (
        <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
            <SectionHeader title="Actions rapides" />
            <Box className="mt-3 space-y-2">
                {ADMIN_DASHBOARD_QUICK_ACTIONS.map((action, index) => {
                    const Icon = adminDashboardQuickActionIcons[action.id];
                    const tones: AdminDashboardTone[] = ["purple", "green", "red", "purple", "purple", "blue"];
                    const tone = tones[index] ?? "purple";

                    return (
                        <ContextualLink className={uiTokens.adminDashboard.quickAction.row} href={action.href} key={action.id}>
                            <Box className={`${uiTokens.adminDashboard.quickAction.icon} ${uiTokens.adminDashboard.metric.tone[tone]}`}>
                                <InlineIcon icon={Icon} className="h-4 w-4" />
                            </Box>
                            <Text as="span">{action.label}</Text>
                            <InlineIcon icon={adminDashboardControlIcons.next} className={uiTokens.adminDashboard.quickAction.chevron} />
                        </ContextualLink>
                    );
                })}
            </Box>
        </CardSurface>
    );
}

function AiUsage({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={uiTokens.adminDashboard.ai.section}>
            <SectionHeader title="Usage des interactions IA" />
            <Box className="mt-3 grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
                <Box className={uiTokens.adminDashboard.ai.overview}>
                    <Text as="h3" className={uiTokens.adminDashboard.sectionTitle}>Vue globale IA</Text>
                    <Box className="mt-3 grid gap-3 sm:grid-cols-2">
                        {dashboard.aiUsage.overview.map((item) => {
                            const Icon = adminDashboardAiIcons[item.id];
                            return (
                                <Box className={uiTokens.adminDashboard.ai.overviewCard} key={item.id}>
                                    <Box className="flex items-center gap-3">
                                        <Box className={`${uiTokens.adminDashboard.metric.icon} ${uiTokens.adminDashboard.metric.tone[item.tone]}`}>
                                            <InlineIcon icon={Icon} className="h-5 w-5" />
                                        </Box>
                                        <Text className={uiTokens.adminDashboard.metric.label}>{item.label}</Text>
                                    </Box>
                                    <Text className={uiTokens.adminDashboard.ai.overviewValue}>{item.value}</Text>
                                    <Text className={uiTokens.adminDashboard.metric.detail}>{item.detail}</Text>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                <Box className="min-w-0">
                    <SectionHeader
                        action={<ContextualLink className={uiTokens.adminDashboard.table.link} href="/organizations">Voir toutes</ContextualLink>}
                        title="Interactions IA par organisation"
                    />
                    <Box className="mt-3 overflow-x-auto">
                        <Box className={`${uiTokens.adminDashboard.ai.table} min-w-[700px]`}>
                            <Box className={uiTokens.adminDashboard.ai.header}>
                                <span>Organisation</span><span>Apprenants</span><span>Simulations IA</span><span>Ask IA persona</span><span>Coach IA</span><span>Total IA</span>
                            </Box>
                            {dashboard.aiUsage.organizations.length === 0 ? (
                                <Box className={uiTokens.adminDashboard.table.empty}>Aucune organisation active.</Box>
                            ) : dashboard.aiUsage.organizations.map((organization) => (
                                <Box className={uiTokens.adminDashboard.ai.row} key={organization.id}>
                                    <Text className="truncate font-bold">{organization.name}</Text>
                                    <Text>{organization.activeLearnerCount}</Text>
                                    <Text>{formatAdminDashboardDuration(organization.simulationSeconds)}</Text>
                                    <Text>{formatAdminDashboardDuration(organization.askPersonaSeconds)}</Text>
                                    <Text>{formatAdminDashboardDuration(organization.coachSeconds)}</Text>
                                    <Text className="font-extrabold">{formatAdminDashboardDuration(organization.totalSeconds)}</Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </CardSurface>
    );
}

function TopRoleplays({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
            <SectionHeader title="Top roleplays joués" />
            <Box className="mt-3 overflow-x-auto">
                <Box className={`${uiTokens.adminDashboard.table.root} min-w-[440px]`}>
                    <Box className={`${uiTokens.adminDashboard.table.header} grid-cols-[28px_minmax(0,1fr)_64px_58px_68px]`}>
                        <span /><span>Roleplay</span><span>Apprenants</span><span>Sessions</span><span>Temps passé</span>
                    </Box>
                    {dashboard.topRoleplays.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucun roleplay terminé sur cette période.</Box>
                    ) : dashboard.topRoleplays.map((roleplay, index) => (
                        <Box className={`${uiTokens.adminDashboard.table.row} grid-cols-[28px_minmax(0,1fr)_64px_58px_68px]`} key={roleplay.id}>
                            <Box className={uiTokens.adminDashboard.table.rank}>{index + 1}</Box>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={`/roleplays/${roleplay.id}`}>
                                {roleplay.title}
                            </ContextualLink>
                            <Text className="text-center font-extrabold">{roleplay.learnerCount}</Text>
                            <Text className="text-center font-extrabold">{roleplay.sessionCount}</Text>
                            <Text className="text-right font-extrabold">{formatAdminDashboardDuration(roleplay.durationSeconds)}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

function OrganizationPerformance({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
            <SectionHeader title="Performance par organisation" />
            <Box className="mt-3 overflow-x-auto">
                <Box className={`${uiTokens.adminDashboard.table.root} min-w-[430px]`}>
                    <Box className={`${uiTokens.adminDashboard.table.header} grid-cols-[minmax(120px,1fr)_76px_70px_62px]`}>
                        <span>Organisation</span><span>Learners actifs</span><span>Score roleplay</span><span>Score quiz</span>
                    </Box>
                    {dashboard.organizationPerformance.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucune performance disponible.</Box>
                    ) : dashboard.organizationPerformance.map((organization) => (
                        <Box className={`${uiTokens.adminDashboard.table.row} grid-cols-[minmax(120px,1fr)_76px_70px_62px]`} key={organization.id}>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={`/organizations/${organization.id}`}>
                                {organization.name}
                            </ContextualLink>
                            <Text className="text-center font-extrabold">{organization.activeLearnerCount}</Text>
                            <Text className={scoreClass(organization.roleplayScore)}>{scoreLabel(organization.roleplayScore)}</Text>
                            <Text className={scoreClass(organization.quizScore)}>{scoreLabel(organization.quizScore)}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

function RecentContent({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
            <SectionHeader
                action={<ContextualLink className={uiTokens.adminDashboard.table.link} href="/roleplays">Voir tous</ContextualLink>}
                title="Contenus récents"
            />
            <Box className="mt-3 overflow-x-auto">
                <Box className={`${uiTokens.adminDashboard.table.root} min-w-[390px]`}>
                    <Box className={`${uiTokens.adminDashboard.table.header} grid-cols-[minmax(110px,1fr)_72px_76px_72px]`}>
                        <span>Scénarios</span><span>Organisation</span><span>Date</span><span>Statut</span>
                    </Box>
                    {dashboard.recentContent.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucun scénario récent.</Box>
                    ) : dashboard.recentContent.map((content) => (
                        <Box className={`${uiTokens.adminDashboard.table.row} grid-cols-[minmax(110px,1fr)_72px_76px_72px]`} key={content.id}>
                            <ContextualLink className={uiTokens.adminDashboard.table.link} href={content.href}>{content.title}</ContextualLink>
                            <Text className={uiTokens.adminDashboard.table.meta}>{content.organizationName}</Text>
                            <Text className={uiTokens.adminDashboard.table.meta}>{content.date}</Text>
                            <Text className={uiTokens.adminDashboard.status[content.status]}>{CONTENT_STATUS_LABELS[content.status]}</Text>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardSurface>
    );
}

function RecentActivities({ dashboard }: { dashboard: AdminDashboardViewData }) {
    return (
        <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
            <SectionHeader
                action={<ContextualLink className={uiTokens.adminDashboard.table.link} href="/users">Voir tous</ContextualLink>}
                title="Activités récentes"
            />
            <Box className="mt-3 overflow-x-auto">
                <Box className={`${uiTokens.adminDashboard.table.root} min-w-[720px]`}>
                    {dashboard.recentActivities.length === 0 ? (
                        <Box className={uiTokens.adminDashboard.table.empty}>Aucune activité récente.</Box>
                    ) : dashboard.recentActivities.map((activity) => {
                        const Icon = adminDashboardActivityIcons[activity.kind];
                        const tone = activity.kind === "roleplay" ? "purple" : "green";
                        return (
                            <Box className={uiTokens.adminDashboard.recentActivity.row} key={activity.id}>
                                <ContextualLink className={uiTokens.adminDashboard.recentActivity.link} href={activity.href}>
                                    <Box className={`${uiTokens.adminDashboard.recentActivity.icon} ${uiTokens.adminDashboard.metric.tone[tone]}`}>
                                        <InlineIcon icon={Icon} className="h-4 w-4" />
                                    </Box>
                                    <Text className="truncate">{activity.label}</Text>
                                </ContextualLink>
                                <Text className={uiTokens.adminDashboard.table.meta}>{activity.organizationName}</Text>
                                <Text className={uiTokens.adminDashboard.recentActivity.detail}>{activity.detail}</Text>
                                <Text className={uiTokens.adminDashboard.recentActivity.date}>{activity.relativeDate}</Text>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </CardSurface>
    );
}

export function AdminDashboardPageContent({ initialDashboardData }: AdminDashboardPageContentProps) {
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
    const RefreshIcon = adminDashboardControlIcons.refresh;

    return (
        <Box as="main" className={uiTokens.adminDashboard.page}>
            <Box className={uiTokens.adminDashboard.container}>
                <Box className="flex flex-col gap-5 py-1 xl:flex-row xl:items-end xl:justify-between">
                    <Box>
                        <Text as="h1" className={uiTokens.adminDashboard.header.title}>Dashboard Admin</Text>
                        <Text className={uiTokens.adminDashboard.header.subtitle}>
                            Pilotez la plateforme MaiaCoach et vos entreprises clientes.
                        </Text>
                    </Box>
                    <Box className={uiTokens.adminDashboard.header.controls}>
                        <Button
                            className={uiTokens.adminDashboard.header.button}
                            disabled={dashboardQuery.isFetching}
                            onClick={() => void dashboardQuery.refetch()}
                        >
                            <InlineIcon icon={RefreshIcon} className={cn("h-4 w-4", dashboardQuery.isFetching && "animate-spin")} />
                            Actualiser
                        </Button>
                        <label className="relative">
                            <span className="sr-only">Période d’affichage</span>
                            <SelectInput
                                aria-label="Période d’affichage"
                                className={uiTokens.adminDashboard.header.select}
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
                        <label className="relative">
                            <span className="sr-only">Filtrer par organisation</span>
                            <SelectInput
                                aria-label="Filtrer par organisation"
                                className={uiTokens.adminDashboard.header.select}
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
                        <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                            {dashboard.metrics.map((metric) => <AdminDashboardMetricCard key={metric.id} metric={metric} />)}
                        </Box>

                        <Box className="grid gap-3.5 xl:grid-cols-[1.35fr_1fr]">
                            <CardSurface className={`${uiTokens.adminDashboard.panel} p-4`}>
                                <SectionHeader
                                    action={<PeriodTabs periodDays={periodDays} setPeriodDays={setPeriodDays} />}
                                    subtitle={`Évolution sur ${periodDays} jours`}
                                    title="Activité de la plateforme"
                                />
                                <AdminDashboardActivityChart data={dashboard.activity} />
                                <Box className={uiTokens.adminDashboard.chart.footnote}>
                                    <Tooltip content="Chaque point indique le nombre de connexions réussies, de roleplays éligibles et de quiz terminés pendant l’intervalle affiché.">
                                        <span className="inline-flex">
                                            <InlineIcon icon={adminDashboardControlIcons.info} className="h-3.5 w-3.5" />
                                        </span>
                                    </Tooltip>
                                    <Text>Toutes les séries utilisent les activités réelles des apprenants.</Text>
                                </Box>
                            </CardSurface>
                            <QuickActions />
                        </Box>

                        {ADMIN_DASHBOARD_FEATURES.aiUsage && <AiUsage dashboard={dashboard} />}

                        <Box className="grid gap-3.5 xl:grid-cols-3">
                            <TopRoleplays dashboard={dashboard} />
                            <OrganizationPerformance dashboard={dashboard} />
                            <RecentContent dashboard={dashboard} />
                        </Box>

                        <RecentActivities dashboard={dashboard} />
                    </>
                )}
            </Box>
        </Box>
    );
}
