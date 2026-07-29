"use client";

import { ArrowLeft, History, ListFilter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ContextualBackLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParams } from "@/features/app-shell/domain";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_DIFFICULTIES,
    CONTENT_DOMAINS,
    getCategoriesForDomain,
} from "@/features/content/domain";
import {
    DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS,
    EVALUATION_ROUTES,
    QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
    countActiveQuizAttemptHistoryFilters,
    filterQuizAttemptHistory,
    isQuizAttemptHistoryDate,
    listQuizAttemptHistoryQuizzes,
    type QuizAttemptHistoryFilters,
} from "@/features/evaluations/domain";
import type { QuizAttemptHistoryItem } from "@/features/evaluations/server";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    DateRangeFilter,
    FilterSelect,
    type FilterSelectOption,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizAttemptHistoryCard } from "./QuizAttemptHistoryCard";

const domainFilterOptions: FilterSelectOption[] = [
    { label: "Tous les domaines", value: QUIZ_ATTEMPT_HISTORY_ALL_VALUE },
    ...CONTENT_DOMAINS,
];

const levelFilterOptions: FilterSelectOption[] = [
    { label: "Tous les niveaux", value: QUIZ_ATTEMPT_HISTORY_ALL_VALUE },
    ...CONTENT_DIFFICULTIES,
];

function categoryFilterOptions(domain: string): FilterSelectOption[] {
    const categories = domain === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
        ? ALL_CONTENT_CATEGORIES
        : getCategoriesForDomain(domain);

    return [
        { label: "Toutes les catégories", value: QUIZ_ATTEMPT_HISTORY_ALL_VALUE },
        ...categories,
    ];
}

function validFilterValue(value: string | null, options: readonly FilterSelectOption[]) {
    const exists = options.some((option) =>
        typeof option === "string" ? option === value : option.value === value,
    );

    return exists && value ? value : QUIZ_ATTEMPT_HISTORY_ALL_VALUE;
}

interface QuizAttemptHistoryPageContentProps {
    attempts: QuizAttemptHistoryItem[];
    backHref?: string;
    showQuizFilter?: boolean;
}

export function QuizAttemptHistoryPageContent({
    attempts,
    backHref = EVALUATION_ROUTES.app.collection,
    showQuizFilter = true,
}: QuizAttemptHistoryPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const quizOptions = useMemo(
        () => [
            { label: "Tous les quiz", value: QUIZ_ATTEMPT_HISTORY_ALL_VALUE },
            ...listQuizAttemptHistoryQuizzes(attempts),
        ],
        [attempts],
    );
    const typeOptions = useMemo<FilterSelectOption[]>(
        () => [
            { label: "Tous les types", value: QUIZ_ATTEMPT_HISTORY_ALL_VALUE },
            ...Array.from(new Set(attempts.map((item) => item.quiz.typeLabel))).sort((left, right) =>
                left.localeCompare(right, "fr"),
            ),
        ],
        [attempts],
    );
    const initialDomain = validFilterValue(searchParams.get("domain"), domainFilterOptions);
    const initialCategoryOptions = categoryFilterOptions(initialDomain);
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const [filters, setFilters] = useState<QuizAttemptHistoryFilters>(() => ({
        category: validFilterValue(searchParams.get("category"), initialCategoryOptions),
        dateFrom: isQuizAttemptHistoryDate(dateFromParam) ? dateFromParam : "",
        dateTo: isQuizAttemptHistoryDate(dateToParam) ? dateToParam : "",
        domain: initialDomain,
        level: validFilterValue(searchParams.get("level"), levelFilterOptions),
        quizId: showQuizFilter
            ? validFilterValue(searchParams.get("quiz"), quizOptions)
            : QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
        type: validFilterValue(searchParams.get("type"), typeOptions),
    }));
    const categories = useMemo(() => categoryFilterOptions(filters.domain), [filters.domain]);
    const filteredAttempts = useMemo(
        () => filterQuizAttemptHistory(attempts, filters),
        [attempts, filters],
    );
    const activeFilterCount = countActiveQuizAttemptHistoryFilters(filters);

    function applyFilters(nextFilters: QuizAttemptHistoryFilters) {
        setFilters(nextFilters);
        router.replace(
            withSearchParams(currentHref, {
                category: nextFilters.category === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.category,
                dateFrom: nextFilters.dateFrom || null,
                dateTo: nextFilters.dateTo || null,
                domain: nextFilters.domain === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.domain,
                level: nextFilters.level === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.level,
                quiz: !showQuizFilter || nextFilters.quizId === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.quizId,
                type: nextFilters.type === QUIZ_ATTEMPT_HISTORY_ALL_VALUE
                    ? null
                    : nextFilters.type,
            }),
            { scroll: false },
        );
    }

    function selectFilter<Key extends keyof QuizAttemptHistoryFilters>(
        key: Key,
        value: QuizAttemptHistoryFilters[Key],
    ) {
        applyFilters({ ...filters, [key]: value });
    }

    function selectDomain(domain: string) {
        applyFilters({
            ...filters,
            category: QUIZ_ATTEMPT_HISTORY_ALL_VALUE,
            domain,
        });
    }

    function resetFilters() {
        applyFilters(DEFAULT_QUIZ_ATTEMPT_HISTORY_FILTERS);
    }

    return (
        <Box as="main" className={uiTokens.quizHistory.page}>
            <Box className={uiTokens.quizHistory.pageContainer}>
                <Box className={uiTokens.quizHistory.pageHeader}>
                    <ContextualBackLink
                        aria-label="Retour"
                        fallbackHref={backHref}
                        className={uiTokens.quizHistory.pageBack}
                    >
                        <InlineIcon icon={ArrowLeft} className={uiTokens.quizHistory.pageBackIcon} />
                    </ContextualBackLink>
                    <Box>
                        <Text as="h1" className={uiTokens.quizHistory.pageTitle}>
                            Historique des quizzes
                        </Text>
                        <Text className={uiTokens.quizHistory.pageSubtitle}>
                            Consultez toutes vos tentatives de quiz et les scores obtenus.
                        </Text>
                    </Box>
                </Box>

                {attempts.length > 0 && (
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
                                showQuizFilter ? "xl:grid-cols-7" : "xl:grid-cols-6",
                            )}
                        >
                            {showQuizFilter && (
                                <FilterSelect
                                    ariaLabel="Filtrer par quiz"
                                    onChange={(value) => selectFilter("quizId", value)}
                                    options={quizOptions}
                                    value={filters.quizId}
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
                                ariaLabel="Filtrer par type"
                                onChange={(value) => selectFilter("type", value)}
                                options={typeOptions}
                                value={filters.type}
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

                {filteredAttempts.length > 0 ? (
                    <Box className="space-y-4">
                        {filteredAttempts.map((item) => (
                            <QuizAttemptHistoryCard key={item.attempt.id} item={item} />
                        ))}
                    </Box>
                ) : attempts.length > 0 ? (
                    <CardSurface className={uiTokens.quizHistory.empty}>
                        <InlineIcon icon={ListFilter} className={uiTokens.quizHistory.emptyIcon} />
                        <Text className={uiTokens.quizHistory.emptyText}>
                            Aucune tentative ne correspond à ces filtres
                        </Text>
                        <Text className={uiTokens.quizHistory.emptyDescription}>
                            Modifiez les critères ou réinitialisez les filtres.
                        </Text>
                        <Button
                            onClick={resetFilters}
                            className={cn(uiTokens.filterBar.resetButton, "mx-auto mt-4")}
                        >
                            <InlineIcon icon={RotateCcw} className={uiTokens.filterBar.resetIcon} />
                            Réinitialiser
                        </Button>
                    </CardSurface>
                ) : (
                    <CardSurface className={uiTokens.quizHistory.empty}>
                        <InlineIcon icon={History} className={uiTokens.quizHistory.emptyIcon} />
                        <Text className={uiTokens.quizHistory.emptyText}>
                            Aucune tentative pour le moment
                        </Text>
                        <Text className={uiTokens.quizHistory.emptyDescription}>
                            Terminez un quiz pour alimenter votre historique.
                        </Text>
                    </CardSurface>
                )}
            </Box>
        </Box>
    );
}
