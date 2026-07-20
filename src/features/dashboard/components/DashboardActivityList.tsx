"use client";

import { useId, useState, type KeyboardEvent } from "react";
import {
    ArrowRight,
    CalendarDays,
    Clock3,
    FileCheck2,
    ListChecks,
    RefreshCw,
} from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import {
    DASHBOARD_ACTIVITY_TABS,
    getDefaultDashboardActivityStatus,
    type DashboardActivityCollection,
    type DashboardActivityKind,
    type DashboardActivityStatus,
} from "@/features/dashboard/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const activityLabels: Record<DashboardActivityKind, { collectionHref: string; title: string }> = {
    roleplay: { collectionHref: "/roleplays", title: "Roleplays" },
    quiz: { collectionHref: "/evaluations", title: "Quiz" },
};

interface DashboardActivityListProps {
    collection: DashboardActivityCollection;
    kind: DashboardActivityKind;
}

function attemptsRemainingLabel(attemptsRemaining: number | null) {
    if (attemptsRemaining === null) return "Tentatives illimitées";
    if (attemptsRemaining === 0) return "Tentatives épuisées";
    return `${attemptsRemaining} tentative${attemptsRemaining > 1 ? "s" : ""} restante${attemptsRemaining > 1 ? "s" : ""}`;
}

function questionCountLabel(questionCount: number) {
    if (questionCount === 0) return "Aucune question";
    return `${questionCount} question${questionCount > 1 ? "s" : ""}`;
}

export function DashboardActivityList({ collection, kind }: DashboardActivityListProps) {
    const baseId = useId();
    const [activeStatus, setActiveStatus] = useState<DashboardActivityStatus>(() =>
        getDefaultDashboardActivityStatus(collection),
    );
    const items = collection.items[activeStatus];
    const labels = activityLabels[kind];

    function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, status: DashboardActivityStatus) {
        if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
        event.preventDefault();
        const currentIndex = DASHBOARD_ACTIVITY_TABS.findIndex((tab) => tab.id === status);
        const nextIndex = event.key === "Home"
            ? 0
            : event.key === "End"
                ? DASHBOARD_ACTIVITY_TABS.length - 1
                : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + DASHBOARD_ACTIVITY_TABS.length)
                    % DASHBOARD_ACTIVITY_TABS.length;
        const nextTab = DASHBOARD_ACTIVITY_TABS[nextIndex];
        if (!nextTab) return;
        setActiveStatus(nextTab.id);
        document.getElementById(`${baseId}-tab-${nextTab.id}`)?.focus();
    }

    return (
        <Box className={`${uiTokens.dashboard.panel} p-4`}>
            <Box className="flex items-center justify-between gap-3">
                <Text as="h2" className={uiTokens.dashboard.sectionTitle}>{labels.title}</Text>
                <ContextualLink className={uiTokens.dashboard.activityList.viewAll} href={labels.collectionHref}>
                    Voir tout
                </ContextualLink>
            </Box>

            <Box aria-label={`Filtrer les ${labels.title.toLowerCase()}`} className="mt-3 flex flex-wrap gap-2" role="tablist">
                {DASHBOARD_ACTIVITY_TABS.map((tab) => {
                    const isActive = activeStatus === tab.id;
                    return (
                        <Button
                            aria-controls={`${baseId}-panel-${tab.id}`}
                            aria-selected={isActive}
                            className={cn(
                                uiTokens.dashboard.activityList.tab,
                                isActive ? uiTokens.dashboard.activityList.tabActive : uiTokens.dashboard.activityList.tabIdle,
                            )}
                            id={`${baseId}-tab-${tab.id}`}
                            key={tab.id}
                            onClick={() => setActiveStatus(tab.id)}
                            onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                            role="tab"
                            tabIndex={isActive ? 0 : -1}
                        >
                            {tab.label} ({collection.counts[tab.id]})
                        </Button>
                    );
                })}
            </Box>

            <Box
                aria-labelledby={`${baseId}-tab-${activeStatus}`}
                className={uiTokens.dashboard.activityList.list}
                id={`${baseId}-panel-${activeStatus}`}
                role="tabpanel"
            >
                {items.length === 0 ? (
                    <Box className={uiTokens.dashboard.activityList.empty}>
                        <Text>Aucune activité dans cette catégorie.</Text>
                        <ContextualLink className={`${uiTokens.dashboard.activityList.viewAll} mt-2 inline-flex`} href={labels.collectionHref}>
                            {kind === "roleplay" ? "Accéder aux roleplays" : "Voir mes quiz"}
                        </ContextualLink>
                    </Box>
                ) : items.map((item) => (
                    <Box className={`${uiTokens.dashboard.activityList.row} flex-col sm:flex-row`} key={item.id}>
                        {item.kind === "roleplay" ? (
                            <Box
                                aria-label={item.name}
                                className={uiTokens.dashboard.activityList.avatar}
                                role="img"
                                style={{ backgroundImage: item.imageSrc ? `url(${item.imageSrc})` : undefined }}
                            />
                        ) : (
                            <Box className={uiTokens.dashboard.activityList.quizIcon}>
                                <InlineIcon icon={FileCheck2} className="h-5 w-5" />
                            </Box>
                        )}

                        <Box className="min-w-0 flex-1 self-stretch sm:self-center">
                            <Box className="flex flex-wrap items-center gap-2">
                                <Text className={uiTokens.dashboard.activityList.title}>{item.name ?? item.title}</Text>
                                <Text className={uiTokens.dashboard.activityList.badge}>{item.category}</Text>
                                <Text className={uiTokens.dashboard.activityList.statusBadge}>{item.statusLabel}</Text>
                            </Box>
                            <Box className={uiTokens.dashboard.activityList.meta}>
                                <span className="inline-flex items-center gap-1.5">
                                    <InlineIcon icon={CalendarDays} className={uiTokens.dashboard.activityList.metaIcon} />
                                    {item.date}
                                </span>
                                {item.duration && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <InlineIcon icon={Clock3} className={uiTokens.dashboard.activityList.metaIcon} />
                                        {item.duration}
                                    </span>
                                )}
                                {item.kind === "quiz" && item.questionCount !== undefined && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <InlineIcon icon={ListChecks} className={uiTokens.dashboard.activityList.metaIcon} />
                                        {questionCountLabel(item.questionCount)}
                                    </span>
                                )}
                                {item.kind === "quiz" && item.attemptsRemaining !== undefined && (
                                    <span className="inline-flex items-center gap-1.5">
                                        <InlineIcon icon={RefreshCw} className={uiTokens.dashboard.activityList.metaIcon} />
                                        {attemptsRemainingLabel(item.attemptsRemaining)}
                                    </span>
                                )}
                            </Box>
                            {item.name && <Text className={uiTokens.dashboard.activityList.subtitle}>{item.title}</Text>}
                        </Box>

                        <Box className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end">
                            {item.score !== undefined && (
                                <Text
                                    aria-label={`Score ${item.score} pour cent, ${item.statusLabel}`}
                                    className={cn(
                                        uiTokens.dashboard.activityList.score,
                                        item.status === "retry" && uiTokens.dashboard.activityList.scoreRetry,
                                    )}
                                >
                                    {item.score}%
                                </Text>
                            )}
                            <ContextualLink className={uiTokens.dashboard.activityList.action} href={item.href}>
                                {item.actionLabel}
                                <InlineIcon icon={ArrowRight} className="h-4 w-4" />
                            </ContextualLink>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
