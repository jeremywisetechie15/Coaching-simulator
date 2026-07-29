"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Copy, Edit3, MoreHorizontal, Plus } from "lucide-react";
import {
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withReturnTo, withSearchParams } from "@/features/app-shell/domain";
import {
    EVALUATION_ROUTES,
    getQuizTypeLabel,
    type QuizListItem,
} from "@/features/evaluations/domain";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_DIFFICULTIES,
    CONTENT_DOMAINS,
    getCategoriesForDomain,
    isLearnerContentStatusFilter,
    LEARNER_CONTENT_STATUS_FILTER,
    LEARNER_CONTENT_STATUS_FILTER_OPTIONS,
    matchesLearnerContentStatusFilter,
    type LearnerContentStatusFilter,
} from "@/features/content/domain";
import {
    ArchiveContentConfirmationModal,
} from "@/features/content/components";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import {
    Box,
    Button,
    CardSurface,
    InlineIcon,
    Text,
} from "@/lib/ui/atoms";
import {
    AnimatedEntityHeader,
    CardActionMenu,
    CardActionMenuButton,
    CardActionMenuLink,
    FilterSelect,
    LibraryFilterBar,
    LibrarySearchField,
    type FilterSelectOption,
} from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizLibraryCard } from "./QuizLibraryCard";

interface EvaluationsPageContentProps {
    canManage: boolean;
    quizzes: QuizListItem[];
}

interface ApiErrorPayload {
    error?: string;
}

async function duplicateQuiz(quizId: string) {
    const response = await fetch(`/api/quizzes/${quizId}/duplicate`, { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer le quiz.");
    }
}

async function archiveQuiz(quizId: string) {
    const response = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver le quiz.");
    }
}

function getFilterOptions(options: string[], allLabel: string): FilterSelectOption[] {
    return options.map((option) => ({
        label: option === "all" ? allLabel : option,
        value: option,
    }));
}

export function EvaluationsPageContent({ canManage, quizzes }: EvaluationsPageContentProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const domainOptions = ["all", ...CONTENT_DOMAINS];
    const difficultyOptions = ["all", ...CONTENT_DIFFICULTIES];
    const typeOptions = useMemo(
        () => ["all", ...Array.from(new Set(quizzes.map((quiz) => getQuizTypeLabel(quiz.type))))],
        [quizzes],
    );
    const initialDomain = domainOptions.includes(searchParams.get("domain") ?? "")
        ? searchParams.get("domain")!
        : "all";
    const initialCategoryOptions = [
        "all",
        ...(initialDomain === "all" ? ALL_CONTENT_CATEGORIES : getCategoriesForDomain(initialDomain)),
    ];
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [domain, setDomain] = useState(initialDomain);
    const [category, setCategory] = useState(
        initialCategoryOptions.includes(searchParams.get("category") ?? "")
            ? searchParams.get("category")!
            : "all",
    );
    const [type, setType] = useState(
        typeOptions.includes(searchParams.get("type") ?? "") ? searchParams.get("type")! : "all",
    );
    const [difficulty, setDifficulty] = useState(
        difficultyOptions.includes(searchParams.get("difficulty") ?? "")
            ? searchParams.get("difficulty")!
            : "all",
    );
    const requestedLearnerStatus = searchParams.get("learnerStatus");
    const [learnerStatus, setLearnerStatus] = useState<LearnerContentStatusFilter>(
        isLearnerContentStatusFilter(requestedLearnerStatus)
            ? requestedLearnerStatus
            : LEARNER_CONTENT_STATUS_FILTER.all,
    );
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busyQuizId, setBusyQuizId] = useState<string | null>(null);
    const [quizToArchive, setQuizToArchive] = useState<QuizListItem | null>(null);

    const categoryOptions = [
        "all",
        ...(domain === "all" ? ALL_CONTENT_CATEGORIES : getCategoriesForDomain(domain)),
    ];

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return quizzes.filter((quiz) => {
            const matchesTerm =
                !term ||
                [quiz.title, quiz.description, quiz.domain, ...quiz.categories, quiz.methodName ?? "", ...quiz.tags]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesDomain = domain === "all" || quiz.domain === domain;
            const matchesCategory = category === "all" || quiz.categories.includes(category);
            const matchesType = type === "all" || getQuizTypeLabel(quiz.type) === type;
            const matchesDifficulty =
                difficulty === "all" || quiz.difficulty === difficulty;
            const matchesLearnerStatus = matchesLearnerContentStatusFilter(
                quiz.learnerStatus,
                learnerStatus,
            );

            return matchesTerm
                && matchesDomain
                && matchesCategory
                && matchesType
                && matchesDifficulty
                && matchesLearnerStatus;
        });
    }, [category, difficulty, domain, learnerStatus, query, quizzes, type]);

    async function handleDuplicate(quizId: string) {
        setError(null);
        setBusyQuizId(quizId);

        try {
            await duplicateQuiz(quizId);
            router.refresh();
            setOpenMenuId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer le quiz.");
        } finally {
            setBusyQuizId(null);
        }
    }

    async function handleArchive(quizId: string) {
        setError(null);
        setBusyQuizId(quizId);

        try {
            await archiveQuiz(quizId);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            router.refresh();
            setOpenMenuId(null);
            setQuizToArchive(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'archiver le quiz.");
        } finally {
            setBusyQuizId(null);
        }
    }

    function selectDomain(nextDomain: string) {
        setDomain(nextDomain);
        setCategory("all");
        router.replace(
            withSearchParams(currentHref, {
                category: null,
                domain: nextDomain === "all" ? null : nextDomain,
            }),
            { scroll: false },
        );
    }

    function selectFilter(
        key: "category" | "difficulty" | "type",
        value: string,
        setter: (nextValue: string) => void,
    ) {
        setter(value);
        router.replace(withSearchParams(currentHref, { [key]: value === "all" ? null : value }), {
            scroll: false,
        });
    }

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(withSearchParams(currentHref, { q: value.trim() || null }), { scroll: false });
    }

    function selectLearnerStatus(value: string) {
        if (!isLearnerContentStatusFilter(value)) return;

        setLearnerStatus(value);
        router.replace(
            withSearchParams(currentHref, {
                learnerStatus:
                    value === LEARNER_CONTENT_STATUS_FILTER.all ? null : value,
            }),
            { scroll: false },
        );
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title="Quiz"
                    tone="quiz"
                    actions={
                        canManage ? (
                        <ContextualLink
                            href={EVALUATION_ROUTES.app.new}
                            className={uiTokens.entityHeader.action.primary}
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer un quiz
                        </ContextualLink>
                        ) : undefined
                    }
                />

                {error && !quizToArchive && (
                    <CardSurface className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                <LibraryFilterBar>
                        <LibrarySearchField
                            ariaLabel="Rechercher un quiz"
                            onChange={updateQuery}
                            placeholder="Rechercher un quiz..."
                            value={query}
                        />
                        <Box className={uiTokens.filterBar.librarySelectDomain}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par domaine"
                                value={domain}
                                onChange={selectDomain}
                                options={getFilterOptions(domainOptions, "Tous les domaines")}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectCategory}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par catégorie"
                                value={category}
                                onChange={(value) => selectFilter("category", value, setCategory)}
                                options={getFilterOptions(categoryOptions, "Toutes les catégories")}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectType}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par type"
                                value={type}
                                onChange={(value) => selectFilter("type", value, setType)}
                                options={getFilterOptions(typeOptions, "Tous les types")}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectQuizLevel}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par niveau de difficulté"
                                value={difficulty}
                                onChange={(value) => selectFilter("difficulty", value, setDifficulty)}
                                options={getFilterOptions(difficultyOptions, "Tous les niveaux")}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectStatus}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par statut"
                                value={learnerStatus}
                                onChange={selectLearnerStatus}
                                options={LEARNER_CONTENT_STATUS_FILTER_OPTIONS}
                            />
                        </Box>
                </LibraryFilterBar>

                {filtered.length > 0 ? (
                    <Box className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((quiz) => (
                            <QuizLibraryCard
                                key={quiz.id}
                                detailHref={withReturnTo(
                                    EVALUATION_ROUTES.app.detail(quiz.id),
                                    currentHref,
                                )}
                                quiz={quiz}
                                actions={
                                    canManage ? (
                                        <Box className="relative">
                                            <Button
                                                aria-label={`Actions pour ${quiz.title}`}
                                                onClick={() =>
                                                    setOpenMenuId(
                                                        openMenuId === quiz.id ? null : quiz.id,
                                                    )
                                                }
                                                className={uiTokens.quizLibraryCard.menuButton}
                                            >
                                                <InlineIcon
                                                    icon={MoreHorizontal}
                                                    className={uiTokens.quizLibraryCard.menuIcon}
                                                />
                                            </Button>
                                            {openMenuId === quiz.id && (
                                                <CardActionMenu>
                                                    <CardActionMenuLink
                                                        href={withReturnTo(
                                                            EVALUATION_ROUTES.app.edit(quiz.id),
                                                            currentHref,
                                                        )}
                                                        icon={Edit3}
                                                        label={ENTITY_ACTION_LABELS.modify}
                                                    />
                                                    <CardActionMenuButton
                                                        disabled={busyQuizId === quiz.id}
                                                        icon={Copy}
                                                        label={ENTITY_ACTION_LABELS.duplicate}
                                                        onClick={() => void handleDuplicate(quiz.id)}
                                                    />
                                                    <CardActionMenuButton
                                                        danger
                                                        disabled={busyQuizId === quiz.id}
                                                        icon={Archive}
                                                        label={ENTITY_ACTION_LABELS.archive}
                                                        onClick={() => {
                                                            setError(null);
                                                            setOpenMenuId(null);
                                                            setQuizToArchive(quiz);
                                                        }}
                                                    />
                                                </CardActionMenu>
                                            )}
                                        </Box>
                                    ) : undefined
                                }
                            />
                        ))}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <Text className={cn("text-[16px] font-extrabold", uiTokens.text.heading)}>
                            Aucun quiz trouvé
                        </Text>
                    </CardSurface>
                )}

                {quizToArchive && (
                    <ArchiveContentConfirmationModal
                        busy={busyQuizId === quizToArchive.id}
                        entityLabel="le quiz"
                        error={error}
                        name={quizToArchive.title}
                        onCancel={() => {
                            setError(null);
                            setQuizToArchive(null);
                        }}
                        onConfirm={() => void handleArchive(quizToArchive.id)}
                    />
                )}
            </Box>
        </Box>
    );
}
