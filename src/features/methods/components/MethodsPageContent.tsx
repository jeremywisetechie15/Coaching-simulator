"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Copy, Edit3, MoreHorizontal, Plus } from "lucide-react";
import {
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withReturnTo, withSearchParams } from "@/features/app-shell/domain";
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
    ContentRemovalConfirmationModal,
    ContentRemovalMenuButton,
} from "@/features/content/components";
import { getMethodScopeLabel, METHOD_ROUTES, type MethodListItem } from "@/features/methods/domain/method";
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

interface MethodsPageContentProps {
    canManage: boolean;
    methods: MethodListItem[];
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

async function duplicateMethodRequest(methodId: string) {
    const response = await fetch(METHOD_ROUTES.api.duplicate(methodId), { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer la méthode.");
    }
}

async function removeMethodRequest(methodId: string, errorMessage: string) {
    const response = await fetch(METHOD_ROUTES.api.detail(methodId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || errorMessage);
    }
}

export function MethodsPageContent({ canManage, methods }: MethodsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const domainOptions = ["all", ...CONTENT_DOMAINS];
    const initialDomain = domainOptions.includes(searchParams.get("domain") ?? "")
        ? searchParams.get("domain")!
        : "all";
    const initialCategoryOptions = [
        "all",
        ...(initialDomain === "all"
            ? ALL_CONTENT_CATEGORIES
            : getCategoriesForDomain(initialDomain)),
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
    const [busyMethodId, setBusyMethodId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [methodToRemove, setMethodToRemove] = useState<MethodListItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const categoryOptions = [
        "all",
        ...(domain === "all" ? ALL_CONTENT_CATEGORIES : getCategoriesForDomain(domain)),
    ];
    const filteredMethods = useMemo(() => {
        const term = query.trim().toLowerCase();

        return methods.filter((method) => {
            const matchesQuery =
                !term ||
                [
                    method.name,
                    method.subtitle,
                    method.description,
                    method.domain,
                    method.category,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(term);
            const matchesDomain = domain === "all" || method.domain === domain;
            const matchesCategory = category === "all" || method.category === category;
            const matchesPublicationStatus = matchesContentStatusFilter(method.status, publicationStatus);

            return matchesQuery && matchesDomain && matchesCategory && matchesPublicationStatus;
        });
    }, [category, domain, methods, publicationStatus, query]);

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(
            withSearchParams(currentHref, { q: value.trim() || null }),
            { scroll: false },
        );
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
            withSearchParams(currentHref, {
                category: value === "all" ? null : value,
            }),
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

    async function handleDuplicate(methodId: string) {
        setError(null);
        setBusyMethodId(methodId);

        try {
            await duplicateMethodRequest(methodId);
            router.refresh();
            setOpenMenuId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer la méthode.");
        } finally {
            setBusyMethodId(null);
        }
    }

    async function handleRemove(method: MethodListItem) {
        setError(null);
        setBusyMethodId(method.id);
        const errorMessage = getContentRemovalErrorMessage(method.status, "la méthode");

        try {
            await removeMethodRequest(method.id, errorMessage);
            router.refresh();
            setOpenMenuId(null);
            setMethodToRemove(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : errorMessage);
        } finally {
            setBusyMethodId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title="Méthodes et Playbooks"
                    tone="method"
                    actions={
                        canManage ? (
                            <ContextualLink
                                href={METHOD_ROUTES.app.create}
                                className={uiTokens.entityHeader.action.primary}
                            >
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Créer une méthode
                            </ContextualLink>
                        ) : undefined
                    }
                />

                <LibraryFilterBar>
                    <LibrarySearchField
                        ariaLabel="Rechercher une méthode"
                        onChange={updateQuery}
                        placeholder="Rechercher une méthode..."
                        value={query}
                    />
                    <Box className={uiTokens.filterBar.librarySelectDomain}>
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

                {error && !methodToRemove && (
                    <CardSurface className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                <Box className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", uiTokens.motion.cardGridReveal)}>
                    {filteredMethods.map((method) => (
                        <CardSurface
                            key={method.id}
                            className="relative flex min-h-[180px] flex-col rounded-[14px] border border-[#E5E7EB] shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                        >
                            {canManage && (
                                <Box className="absolute right-4 top-4 z-10">
                                    <Button
                                        aria-label={`Actions pour ${method.name}`}
                                        onClick={() => setOpenMenuId(openMenuId === method.id ? null : method.id)}
                                        className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                                    >
                                        <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                    </Button>
                                    {openMenuId === method.id && (
                                        <CardActionMenu>
                                            <CardActionMenuLink
                                                href={withReturnTo(METHOD_ROUTES.app.edit(method.id), currentHref)}
                                                icon={Edit3}
                                                label={ENTITY_ACTION_LABELS.modify}
                                            />
                                            <CardActionMenuButton
                                                disabled={busyMethodId === method.id}
                                                icon={Copy}
                                                label={ENTITY_ACTION_LABELS.duplicate}
                                                onClick={() => void handleDuplicate(method.id)}
                                            />
                                            <ContentRemovalMenuButton
                                                busy={busyMethodId === method.id}
                                                status={method.status}
                                                onClick={() => {
                                                    setError(null);
                                                    setOpenMenuId(null);
                                                    setMethodToRemove(method);
                                                }}
                                            />
                                        </CardActionMenu>
                                    )}
                                </Box>
                            )}

                            <ContextualLink href={METHOD_ROUTES.app.detail(method.id)} className="flex flex-1 flex-col p-6 pr-12">
                                <Text as="h3" className="text-[19px] font-extrabold leading-7 text-[#111827]">
                                    {method.name}
                                </Text>
                                <Text className="mt-2 line-clamp-2 flex-1 text-[14px] font-medium leading-6 text-[#596273]">
                                    {method.subtitle || method.description || "Méthode pédagogique configurable"}
                                </Text>
                                <Box className="mt-4 flex flex-wrap gap-2">
                                    {method.domain && (
                                        <Box className={cn("inline-flex min-h-7 w-fit items-center rounded-md border px-2.5 py-1 text-[12px] font-semibold", uiTokens.tone.info.soft)}>
                                            Domaine · {method.domain}
                                        </Box>
                                    )}
                                    {method.category && (
                                        <Box className={cn("inline-flex min-h-7 w-fit items-center rounded-md border px-2.5 py-1 text-[12px] font-semibold", uiTokens.tone.primary.soft)}>
                                            Catégorie · {method.category}
                                        </Box>
                                    )}
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 text-[12px] font-semibold text-[#4338CA]">
                                        {method.stepCount} étape{method.stepCount > 1 ? "s" : ""}
                                    </Box>
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 text-[12px] font-semibold text-[#15803D]">
                                        {CONTENT_STATUS_LABELS[method.status]}
                                    </Box>
                                    <Box className="inline-flex h-7 w-fit items-center rounded-md border border-[#E5E7EB] bg-white px-2.5 text-[12px] font-semibold text-[#4B5563]">
                                        {getMethodScopeLabel(method)}
                                    </Box>
                                </Box>
                            </ContextualLink>
                        </CardSurface>
                    ))}
                </Box>

                {filteredMethods.length === 0 && (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={BookOpen} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune méthode trouvée</Text>
                    </CardSurface>
                )}

                {methodToRemove && (
                    <ContentRemovalConfirmationModal
                        busy={busyMethodId === methodToRemove.id}
                        entityLabel="la méthode"
                        error={error}
                        name={methodToRemove.name}
                        onCancel={() => {
                            setError(null);
                            setMethodToRemove(null);
                        }}
                        onConfirm={() => void handleRemove(methodToRemove)}
                        status={methodToRemove.status}
                    />
                )}
            </Box>
        </Box>
    );
}
