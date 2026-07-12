"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, History, ListFilter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
    ContextualBackLink,
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParams } from "@/features/app-shell/domain";
import { DiscProfileBadge } from "@/features/content/components";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_DOMAINS,
    getCategoriesForDomain,
} from "@/features/content/domain";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    roleplayDifficultyOptions,
} from "@/features/roleplays/data/roleplays";
import {
    DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS,
    ROLEPLAY_ROUTES,
    ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
    countActiveRoleplaySessionHistoryFilters,
    filterRoleplaySessionHistory,
    isRoleplaySessionHistoryDate,
    listRoleplaySessionHistoryRoleplays,
    type RoleplaySessionHistoryFilters,
} from "@/features/roleplays/domain";
import type { RoleplaySessionHistoryItem } from "@/features/roleplays/server";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    DateRangeFilter,
    FilterSelect,
    type FilterSelectOption,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const domainFilterOptions: FilterSelectOption[] = [
    { label: "Tous les domaines", value: ROLEPLAY_SESSION_HISTORY_ALL_VALUE },
    ...CONTENT_DOMAINS,
];

const levelFilterOptions: FilterSelectOption[] = [
    { label: "Tous les niveaux", value: ROLEPLAY_SESSION_HISTORY_ALL_VALUE },
    ...roleplayDifficultyOptions,
];

function categoryFilterOptions(domain: string): FilterSelectOption[] {
    const categories = domain === ROLEPLAY_SESSION_HISTORY_ALL_VALUE
        ? ALL_CONTENT_CATEGORIES
        : getCategoriesForDomain(domain);

    return [
        { label: "Toutes les catégories", value: ROLEPLAY_SESSION_HISTORY_ALL_VALUE },
        ...categories,
    ];
}

function validFilterValue(value: string | null, options: readonly FilterSelectOption[]) {
    const exists = options.some((option) =>
        typeof option === "string" ? option === value : option.value === value,
    );

    return exists && value ? value : ROLEPLAY_SESSION_HISTORY_ALL_VALUE;
}

function scoreColor(score: number) {
    if (score >= 80) {
        return "#16A34A";
    }
    if (score >= 60) {
        return "#F59E0B";
    }
    return "#F97316";
}

function ScoreRing({ score }: { score: number }) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - score / 100);
    const color = scoreColor(score);

    return (
        <Box className="relative h-[76px] w-[76px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r={radius} fill="none" stroke="#ECEEF3" strokeWidth="7" />
                <circle
                    cx="38"
                    cy="38"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <Box className="absolute inset-0 flex items-center justify-center">
                <Text className="text-[16px] font-extrabold text-[#111827]">{score}%</Text>
            </Box>
        </Box>
    );
}

interface SessionsHistoryPageContentProps {
    backHref?: string;
    sessions: RoleplaySessionHistoryItem[];
    showRoleplayFilter?: boolean;
}

export function SessionsHistoryPageContent({
    backHref = ROLEPLAY_ROUTES.app.collection,
    sessions,
    showRoleplayFilter = true,
}: SessionsHistoryPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const roleplayOptions = useMemo(
        () => [
            { label: "Tous les roleplays", value: ROLEPLAY_SESSION_HISTORY_ALL_VALUE },
            ...listRoleplaySessionHistoryRoleplays(sessions),
        ],
        [sessions],
    );
    const initialDomain = validFilterValue(searchParams.get("domain"), domainFilterOptions);
    const initialCategoryOptions = categoryFilterOptions(initialDomain);
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const [filters, setFilters] = useState<RoleplaySessionHistoryFilters>(() => ({
        category: validFilterValue(searchParams.get("category"), initialCategoryOptions),
        dateFrom: isRoleplaySessionHistoryDate(dateFromParam) ? dateFromParam : "",
        dateTo: isRoleplaySessionHistoryDate(dateToParam) ? dateToParam : "",
        domain: initialDomain,
        level: validFilterValue(searchParams.get("level"), levelFilterOptions),
        roleplayId: showRoleplayFilter
            ? validFilterValue(searchParams.get("roleplay"), roleplayOptions)
            : ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
    }));
    const categories = useMemo(() => categoryFilterOptions(filters.domain), [filters.domain]);
    const filteredSessions = useMemo(
        () => filterRoleplaySessionHistory(sessions, filters),
        [filters, sessions],
    );
    const activeFilterCount = countActiveRoleplaySessionHistoryFilters(filters);

    function applyFilters(nextFilters: RoleplaySessionHistoryFilters) {
        setFilters(nextFilters);
        router.replace(
            withSearchParams(currentHref, {
                category: nextFilters.category === ROLEPLAY_SESSION_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.category,
                dateFrom: nextFilters.dateFrom || null,
                dateTo: nextFilters.dateTo || null,
                domain: nextFilters.domain === ROLEPLAY_SESSION_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.domain,
                level: nextFilters.level === ROLEPLAY_SESSION_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.level,
                period: null,
                roleplay: !showRoleplayFilter || nextFilters.roleplayId === ROLEPLAY_SESSION_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.roleplayId,
            }),
            { scroll: false },
        );
    }

    function selectFilter<Key extends keyof RoleplaySessionHistoryFilters>(
        key: Key,
        value: RoleplaySessionHistoryFilters[Key],
    ) {
        applyFilters({ ...filters, [key]: value });
    }

    function selectDomain(domain: string) {
        applyFilters({
            ...filters,
            category: ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
            domain,
        });
    }

    function resetFilters() {
        applyFilters(DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS);
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex items-start gap-6">
                    <ContextualBackLink
                        fallbackHref={backHref}
                        aria-label="Retour"
                        className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Box>
                        <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                            Historique des sessions
                        </Text>
                        <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#596273]">
                            Consultez toutes vos sessions de roleplay et leurs évaluations
                        </Text>
                    </Box>
                </Box>

                {sessions.length > 0 && (
                    <CardSurface className={uiTokens.filterBar.surface}>
                        <Box className={uiTokens.filterBar.header}>
                            <Text className={uiTokens.filterBar.title}>
                                <InlineIcon icon={ListFilter} className={uiTokens.filterBar.titleIcon} />
                                Filtres
                                {activeFilterCount > 0 && (
                                    <Text as="span" className={uiTokens.filterBar.activeCount}>
                                        {activeFilterCount}
                                    </Text>
                                )}
                            </Text>
                            {activeFilterCount > 0 && (
                                <Button onClick={resetFilters} className={uiTokens.filterBar.resetButton}>
                                    <InlineIcon icon={RotateCcw} className={uiTokens.filterBar.resetIcon} />
                                    Réinitialiser
                                </Button>
                            )}
                        </Box>
                        <Box
                            className={cn(
                                uiTokens.filterBar.controls,
                                showRoleplayFilter ? "xl:grid-cols-6" : "xl:grid-cols-5",
                            )}
                        >
                            {showRoleplayFilter && (
                                <FilterSelect
                                    ariaLabel="Filtrer par roleplay"
                                    onChange={(value) => selectFilter("roleplayId", value)}
                                    options={roleplayOptions}
                                    value={filters.roleplayId}
                                />
                            )}
                            <FilterSelect
                                ariaLabel="Filtrer par domaine"
                                onChange={selectDomain}
                                options={domainFilterOptions}
                                value={filters.domain}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par catégorie"
                                onChange={(value) => selectFilter("category", value)}
                                options={categories}
                                value={filters.category}
                            />
                            <FilterSelect
                                ariaLabel="Filtrer par niveau"
                                onChange={(value) => selectFilter("level", value)}
                                options={levelFilterOptions}
                                value={filters.level}
                            />
                            <DateRangeFilter
                                className="sm:col-span-2"
                                dateFrom={filters.dateFrom}
                                dateTo={filters.dateTo}
                                onChange={({ dateFrom, dateTo }) => applyFilters({
                                    ...filters,
                                    dateFrom,
                                    dateTo,
                                })}
                            />
                        </Box>
                    </CardSurface>
                )}

                {filteredSessions.length > 0 ? (
                    <Box className="space-y-4">
                        {filteredSessions.map(({ roleplay, session }) => {
                            const categoryStyle =
                                categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
                            const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];

                            return (
                                <CardSurface
                                    key={session.id}
                                    className="flex flex-col gap-5 rounded-[16px] border border-[#E5E7EB] p-5 shadow-none transition duration-200 hover:border-[#D8DCE6] hover:shadow-[0_12px_28px_rgba(17,24,39,0.08)] md:flex-row md:items-center md:justify-between"
                                >
                                    <Box className="flex items-center gap-4">
                                        <Box className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-[#E7EAFF] bg-[#F1F2F6]">
                                            <Box
                                                aria-label={roleplay.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                            />
                                        </Box>
                                        <Box>
                                            <Text as="h2" className="text-[18px] font-extrabold text-[#111827]">
                                                {roleplay.name}
                                            </Text>
                                            <Box className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] font-semibold text-[#6B7280]">
                                                <Box className="flex items-center gap-1.5">
                                                    <InlineIcon icon={CalendarDays} className="h-4 w-4 text-[#9CA3AF]" />
                                                    {session.date}
                                                </Box>
                                                <Box className="flex items-center gap-1.5">
                                                    <InlineIcon icon={Clock} className="h-4 w-4 text-[#9CA3AF]" />
                                                    Durée: {session.duration}
                                                </Box>
                                            </Box>
                                            <Box className="mt-2.5 flex flex-wrap items-center gap-2">
                                                <Box
                                                    className="inline-flex h-[26px] items-center rounded-lg px-2.5 text-[12px] font-semibold"
                                                    style={{
                                                        backgroundColor: categoryStyle.bg,
                                                        color: categoryStyle.text,
                                                    }}
                                                >
                                                    {roleplay.category}
                                                </Box>
                                                <Box
                                                    className="inline-flex h-[26px] items-center rounded-lg border px-2.5 text-[12px] font-semibold"
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
                                                    className="h-[26px] border-0 text-[12px] font-semibold"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box className="flex items-center gap-5 md:shrink-0">
                                        <ScoreRing score={session.score} />
                                        <ContextualLink
                                            href={ROLEPLAY_ROUTES.app.sessionHistoryDetail(session.id)}
                                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                        >
                                            Voir évaluation &gt;
                                        </ContextualLink>
                                    </Box>
                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : sessions.length > 0 ? (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={ListFilter} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">
                            Aucune session ne correspond à ces filtres
                        </Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Modifiez les critères ou réinitialisez les filtres.
                        </Text>
                        <Button onClick={resetFilters} className={cn(uiTokens.filterBar.resetButton, "mx-auto mt-4")}>
                            <InlineIcon icon={RotateCcw} className={uiTokens.filterBar.resetIcon} />
                            Réinitialiser
                        </Button>
                    </CardSurface>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={History} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune session pour le moment</Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Lancez un roleplay pour démarrer votre historique.
                        </Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}
