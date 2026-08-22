"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ClipboardList,
    Copy,
    Edit3,
    ListChecks,
    MoreHorizontal,
    Plus,
    Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContextualLink, useCurrentAppHref } from "@/features/app-shell/components";
import { APP_NAVIGATION_LABEL, withReturnTo, withSearchParams } from "@/features/app-shell/domain";
import {
    ContentRemovalConfirmationModal,
    ContentRemovalMenuButton,
} from "@/features/content/components";
import {
    ALL_CONTENT_CATEGORIES,
    CONTENT_DOMAINS,
    CONTENT_STATUS_FILTER,
    CONTENT_STATUS_LABELS,
    NON_ARCHIVED_CONTENT_STATUS_FILTER_OPTIONS,
    getCategoriesForDomain,
    getContentRemovalErrorMessage,
    isNonArchivedContentStatusFilter,
    matchesContentStatusFilter,
    type ContentStatusFilter,
} from "@/features/content/domain";
import {
    SCORECARD_ROUTES,
    SCORECARD_VISIBILITY_LABELS,
    type ScorecardListItem,
} from "@/features/scorecards/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
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

interface ScorecardsPageContentProps {
    canManage: boolean;
    scorecards: ScorecardListItem[];
}

interface ApiErrorPayload {
    error?: string;
}

function getFilterOptions(options: readonly string[], allLabel: string): FilterSelectOption[] {
    return options.map((option) => ({
        label: option === "all" ? allLabel : option,
        value: option,
    }));
}

async function duplicateScorecardRequest(scorecardId: string) {
    const response = await fetch(SCORECARD_ROUTES.api.duplicate(scorecardId), { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer la scorecard.");
    }
}

async function removeScorecardRequest(scorecardId: string, errorMessage: string) {
    const response = await fetch(SCORECARD_ROUTES.api.detail(scorecardId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || errorMessage);
    }
}

export function ScorecardsPageContent({ canManage, scorecards }: ScorecardsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const domainOptions = ["all", ...CONTENT_DOMAINS];
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
    const requestedPublicationStatus = searchParams.get("publicationStatus");
    const [publicationStatus, setPublicationStatus] = useState<ContentStatusFilter>(
        isNonArchivedContentStatusFilter(requestedPublicationStatus)
            ? requestedPublicationStatus
            : CONTENT_STATUS_FILTER.all,
    );
    const [busyScorecardId, setBusyScorecardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [scorecardToRemove, setScorecardToRemove] = useState<ScorecardListItem | null>(null);
    const categoryOptions = [
        "all",
        ...(domain === "all" ? ALL_CONTENT_CATEGORIES : getCategoriesForDomain(domain)),
    ];

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        return scorecards.filter((scorecard) => {
            const matchesTerm =
                !term ||
                [scorecard.name, scorecard.description, scorecard.domain, scorecard.category, scorecard.methodName]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesDomain = domain === "all" || scorecard.domain === domain;
            const matchesCategory = category === "all" || scorecard.category === category;
            const matchesPublicationStatus = matchesContentStatusFilter(scorecard.status, publicationStatus);

            return matchesTerm && matchesDomain && matchesCategory && matchesPublicationStatus;
        });
    }, [category, domain, publicationStatus, query, scorecards]);

    async function handleDuplicate(scorecardId: string) {
        setError(null);
        setBusyScorecardId(scorecardId);

        try {
            await duplicateScorecardRequest(scorecardId);
            setOpenMenuId(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer la scorecard.");
        } finally {
            setBusyScorecardId(null);
        }
    }

    async function handleRemove() {
        if (!scorecardToRemove) return;

        setError(null);
        setBusyScorecardId(scorecardToRemove.id);
        const errorMessage = getContentRemovalErrorMessage(scorecardToRemove.status, "la scorecard");

        try {
            await removeScorecardRequest(scorecardToRemove.id, errorMessage);
            setScorecardToRemove(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : errorMessage);
        } finally {
            setBusyScorecardId(null);
        }
    }

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(withSearchParams(currentHref, { q: value.trim() || null }), { scroll: false });
    }

    function updateDomain(value: string) {
        setDomain(value);
        setCategory("all");
        router.replace(
            withSearchParams(currentHref, {
                category: null,
                domain: value === "all" ? null : value,
            }),
            { scroll: false },
        );
    }

    function updateCategory(value: string) {
        setCategory(value);
        router.replace(
            withSearchParams(currentHref, { category: value === "all" ? null : value }),
            { scroll: false },
        );
    }

    function updatePublicationStatus(value: string) {
        if (!isNonArchivedContentStatusFilter(value)) return;

        setPublicationStatus(value);
        router.replace(
            withSearchParams(currentHref, {
                publicationStatus: value === CONTENT_STATUS_FILTER.all ? null : value,
            }),
            { scroll: false },
        );
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title={APP_NAVIGATION_LABEL.scorecards}
                    tone="scorecard"
                    actions={
                        canManage ? (
                            <ContextualLink
                                href={SCORECARD_ROUTES.app.create}
                                className={uiTokens.entityHeader.action.primary}
                            >
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Créer une scorecard
                            </ContextualLink>
                        ) : undefined
                    }
                />

                <LibraryFilterBar>
                    <LibrarySearchField
                        ariaLabel="Rechercher une scorecard"
                        onChange={updateQuery}
                        placeholder="Rechercher une scorecard..."
                        value={query}
                    />
                    <Box className={uiTokens.filterBar.librarySelectScorecardDomain}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par domaine"
                            onChange={updateDomain}
                            options={getFilterOptions(domainOptions, "Tous les domaines")}
                            value={domain}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectCategory}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par catégorie"
                            onChange={updateCategory}
                            options={getFilterOptions(categoryOptions, "Toutes les catégories")}
                            value={category}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectStatus}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par statut de publication"
                            onChange={updatePublicationStatus}
                            options={NON_ARCHIVED_CONTENT_STATUS_FILTER_OPTIONS}
                            value={publicationStatus}
                        />
                    </Box>
                </LibraryFilterBar>

                {error && !scorecardToRemove && (
                    <CardSurface className="mt-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                {filtered.length === 0 ? (
                    <Box className="flex flex-col items-center justify-center py-24 text-center">
                        <InlineIcon icon={ClipboardList} className={cn("h-12 w-12", uiTokens.text.muted)} />
                        <Text className={cn("mt-4 text-[15px] font-semibold", uiTokens.text.muted)}>
                            Aucune scorecard trouvée
                        </Text>
                    </Box>
                ) : (
                    <Box className={cn("mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3", uiTokens.motion.cardGridReveal)}>
                        {filtered.map((scorecard) => (
                            <ScorecardCard
                                key={scorecard.id}
                                busy={busyScorecardId === scorecard.id}
                                isMenuOpen={openMenuId === scorecard.id}
                                onRemove={() => {
                                    setError(null);
                                    setOpenMenuId(null);
                                    setScorecardToRemove(scorecard);
                                }}
                                onDuplicate={() => void handleDuplicate(scorecard.id)}
                                onToggleMenu={() => setOpenMenuId(openMenuId === scorecard.id ? null : scorecard.id)}
                                showActions={canManage}
                                scorecard={scorecard}
                            />
                        ))}
                    </Box>
                )}

                {scorecardToRemove && (
                    <ContentRemovalConfirmationModal
                        busy={busyScorecardId === scorecardToRemove.id}
                        entityLabel="la scorecard"
                        error={error}
                        name={scorecardToRemove.name}
                        onCancel={() => {
                            setScorecardToRemove(null);
                            setError(null);
                        }}
                        onConfirm={() => void handleRemove()}
                        status={scorecardToRemove.status}
                    />
                )}
            </Box>
        </Box>
    );
}

interface ScorecardCardProps {
    busy: boolean;
    isMenuOpen: boolean;
    onRemove: () => void;
    onDuplicate: () => void;
    onToggleMenu: () => void;
    scorecard: ScorecardListItem;
    showActions: boolean;
}

function ScorecardCard({
    busy,
    isMenuOpen,
    onRemove,
    onDuplicate,
    onToggleMenu,
    scorecard,
    showActions,
}: ScorecardCardProps) {
    const currentHref = useCurrentAppHref();

    return (
        <CardSurface className="relative flex h-full flex-col rounded-[16px] border border-[#E5E7EB] shadow-none transition hover:border-[#C9C2FB] hover:shadow-[0_16px_36px_rgba(17,24,39,0.08)]">
            {showActions && (
                <Box className="absolute right-4 top-4 z-10">
                    <Button
                        aria-label={`Actions pour ${scorecard.name}`}
                        onClick={onToggleMenu}
                        className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                    >
                        <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                    </Button>
                    {isMenuOpen && (
                        <CardActionMenu>
                            <CardActionMenuLink
                                href={withReturnTo(SCORECARD_ROUTES.app.edit(scorecard.id), currentHref)}
                                icon={Edit3}
                                label={ENTITY_ACTION_LABELS.modify}
                            />
                            <CardActionMenuButton
                                disabled={busy}
                                icon={Copy}
                                label={ENTITY_ACTION_LABELS.duplicate}
                                onClick={onDuplicate}
                            />
                            <ContentRemovalMenuButton
                                busy={busy}
                                onClick={onRemove}
                                status={scorecard.status}
                            />
                        </CardActionMenu>
                    )}
                </Box>
            )}

            <ContextualLink
                href={SCORECARD_ROUTES.app.detail(scorecard.id)}
                aria-label={`Voir la scorecard ${scorecard.name}`}
                className="flex h-full flex-col rounded-[16px] p-6 pr-12 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5140F0]/15"
            >
                <Box className="flex flex-wrap items-center gap-2">
                    {scorecard.category && <Badge>{scorecard.category}</Badge>}
                    {scorecard.level && <Badge tone="purple">{scorecard.level}</Badge>}
                    <Badge tone={scorecard.status === "published" ? "green" : "gray"}>
                        {CONTENT_STATUS_LABELS[scorecard.status]}
                    </Badge>
                </Box>

                <Text as="h3" className={cn("mt-4 text-[19px] font-extrabold leading-7", uiTokens.text.heading)}>
                    {scorecard.name}
                </Text>
                <Text
                    className={cn(
                        "mt-2 min-h-[48px] min-w-0 text-[14px] font-medium leading-6",
                        uiTokens.text.muted,
                    )}
                    style={{
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        display: "-webkit-box",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {scorecard.description || "Aucune description renseignée."}
                </Text>

                <Box className="mt-4 flex flex-col gap-2">
                    <MetaLine
                        icon={ListChecks}
                        label={`${scorecard.stepCount} étape${scorecard.stepCount > 1 ? "s" : ""}`}
                    />
                    <MetaLine
                        icon={Target}
                        label={`${scorecard.criteriaCount} critère${scorecard.criteriaCount > 1 ? "s" : ""}`}
                    />
                    <Text className={cn("min-w-0 truncate text-[13px] font-semibold", uiTokens.text.primary)}>
                        {scorecard.methodName}
                    </Text>
                </Box>

                <Box className="mt-4 flex items-center gap-2">
                    <Badge tone="gray">{SCORECARD_VISIBILITY_LABELS[scorecard.visibility]}</Badge>
                </Box>
            </ContextualLink>
        </CardSurface>
    );
}

function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "purple" | "green" | "gray" }) {
    const tones = {
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        gray: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        purple: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]",
    } as const;

    return (
        <Box className={cn("inline-flex h-7 items-center rounded-md border px-2.5 text-[12px] font-semibold", tones[tone])}>
            {children}
        </Box>
    );
}

function MetaLine({ icon, label }: { icon: LucideIcon; label: string }) {
    return (
        <Box className="flex min-w-0 items-center gap-2 text-[14px] font-semibold text-[#4B5563]">
            <InlineIcon icon={icon} className="h-4 w-4 text-[#9CA3AF]" />
            <span className="min-w-0 truncate">{label}</span>
        </Box>
    );
}
