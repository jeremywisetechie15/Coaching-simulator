"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, Copy, Edit3, Eye, History, Info, MoreHorizontal, Phone, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withReturnTo, withSearchParams } from "@/features/app-shell/domain";
import {
    ArchiveContentConfirmationModal,
    LearnerContentStatusBadge,
} from "@/features/content/components";
import {
    isLearnerContentStatusFilter,
    isSelectableContent,
    LEARNER_CONTENT_STATUS_FILTER,
    LEARNER_CONTENT_STATUS_FILTER_OPTIONS,
    type LearnerContentStatusFilter,
} from "@/features/content/domain";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    filterRoleplaysByLibraryFilters,
    getRoleplayCategoryFilterOptions,
    roleplayCategoryFilterOptions,
    roleplayDiscFilterOptions,
    roleplayDomainFilterOptions,
    roleplayLevelFilterOptions,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { ROLEPLAY_ROUTES } from "@/features/roleplays/domain";
import {
    Box,
    Button,
    CardSurface,
    InlineIcon,
    Text,
    Tooltip,
} from "@/lib/ui/atoms";
import {
    AnimatedEntityHeader,
    CardActionMenu,
    CardActionMenuButton,
    CardActionMenuLink,
    FilterSelect,
    LibraryFilterBar,
    LibrarySearchField,
} from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface RoleplaysPageContentProps {
    canManage: boolean;
    roleplays: RoleplayItem[];
}

const CARD_DESCRIPTION_MAX_LENGTH = 145;

function getCardDescriptionExcerpt(description: string) {
    const normalizedDescription = description.replace(/\s+/g, " ").trim();

    if (normalizedDescription.length <= CARD_DESCRIPTION_MAX_LENGTH) {
        return normalizedDescription;
    }

    const excerpt = normalizedDescription.slice(0, CARD_DESCRIPTION_MAX_LENGTH);
    const lastSpaceIndex = excerpt.lastIndexOf(" ");
    const safeExcerpt = lastSpaceIndex > 80 ? excerpt.slice(0, lastSpaceIndex) : excerpt;

    return `${safeExcerpt.trim()}...`;
}

interface ApiErrorPayload {
    error?: string;
}

async function duplicateRoleplayRequest(roleplayId: string) {
    const response = await fetch(ROLEPLAY_ROUTES.api.duplicate(roleplayId), { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer le roleplay.");
    }
}

async function archiveRoleplayRequest(roleplayId: string) {
    const response = await fetch(ROLEPLAY_ROUTES.api.detail(roleplayId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'archiver le roleplay.");
    }
}

export function RoleplaysPageContent({ canManage, roleplays }: RoleplaysPageContentProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const initialDomain = roleplayDomainFilterOptions.includes(searchParams.get("domain") ?? "")
        ? searchParams.get("domain")!
        : roleplayDomainFilterOptions[0];
    const initialCategoryOptions = getRoleplayCategoryFilterOptions(initialDomain);
    const [domain, setDomain] = useState(initialDomain);
    const [category, setCategory] = useState(
        initialCategoryOptions.includes(searchParams.get("category") ?? "")
            ? searchParams.get("category")!
            : roleplayCategoryFilterOptions[0],
    );
    const [level, setLevel] = useState(
        roleplayLevelFilterOptions.includes(searchParams.get("level") ?? "")
            ? searchParams.get("level")!
            : roleplayLevelFilterOptions[0],
    );
    const requestedLearnerStatus = searchParams.get("learnerStatus");
    const [learnerStatus, setLearnerStatus] = useState<LearnerContentStatusFilter>(
        isLearnerContentStatusFilter(requestedLearnerStatus)
            ? requestedLearnerStatus
            : LEARNER_CONTENT_STATUS_FILTER.all,
    );
    const [busyRoleplayId, setBusyRoleplayId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [roleplayToArchive, setRoleplayToArchive] = useState<RoleplayItem | null>(null);

    const categoryOptions = useMemo(() => getRoleplayCategoryFilterOptions(domain), [domain]);
    const filteredRoleplays = useMemo(
        () =>
            filterRoleplaysByLibraryFilters(roleplays, {
                category,
                disc: roleplayDiscFilterOptions[0],
                domain,
                learnerStatus,
                level,
                query,
            }),
        [category, domain, learnerStatus, level, query, roleplays],
    );

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(withSearchParams(currentHref, { q: value.trim() || null }), {
            scroll: false,
        });
    }

    function selectDomain(nextDomain: string) {
        setDomain(nextDomain);
        setCategory(roleplayCategoryFilterOptions[0]);
        router.replace(
            withSearchParams(currentHref, {
                category: null,
                domain: nextDomain === roleplayDomainFilterOptions[0] ? null : nextDomain,
            }),
            { scroll: false },
        );
    }

    function selectFilter(
        key: "category" | "level",
        value: string,
        fallback: string,
        setter: (nextValue: string) => void,
    ) {
        setter(value);
        router.replace(
            withSearchParams(currentHref, { [key]: value === fallback ? null : value }),
            { scroll: false },
        );
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

    async function handleDuplicate(roleplayId: string) {
        setError(null);
        setBusyRoleplayId(roleplayId);

        try {
            await duplicateRoleplayRequest(roleplayId);
            setOpenMenuId(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de dupliquer le roleplay.");
        } finally {
            setBusyRoleplayId(null);
        }
    }

    async function handleArchive() {
        if (!roleplayToArchive) return;

        setError(null);
        setBusyRoleplayId(roleplayToArchive.id);

        try {
            await archiveRoleplayRequest(roleplayToArchive.id);
            setRoleplayToArchive(null);
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'archiver le roleplay.");
        } finally {
            setBusyRoleplayId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title="Bibliothèque de Roleplays"
                    tone="roleplay"
                    actions={
                        <>
                            {canManage && (
                                <ContextualLink
                                    href="/roleplays/new"
                                    className={uiTokens.entityHeader.action.primary}
                                >
                                    <InlineIcon icon={Plus} className="h-4 w-4" />
                                    Créer un scénario
                                </ContextualLink>
                            )}
                        <ContextualLink
                            href={ROLEPLAY_ROUTES.app.history}
                            className={uiTokens.entityHeader.action.primary}
                        >
                            Historique des sessions
                            </ContextualLink>
                        </>
                    }
                />

                <LibraryFilterBar>
                        <LibrarySearchField
                            ariaLabel="Rechercher un scénario"
                            onChange={updateQuery}
                            placeholder="Rechercher un scénario..."
                            value={query}
                        />
                        <Box className={uiTokens.filterBar.librarySelectDomain}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par domaine"
                                options={roleplayDomainFilterOptions}
                                value={domain}
                                onChange={selectDomain}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectCategory}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par catégorie"
                                options={categoryOptions}
                                value={category}
                                onChange={(value) =>
                                    selectFilter("category", value, roleplayCategoryFilterOptions[0], setCategory)
                                }
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectLevel}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par niveau"
                                options={roleplayLevelFilterOptions}
                                value={level}
                                onChange={(value) => selectFilter("level", value, roleplayLevelFilterOptions[0], setLevel)}
                            />
                        </Box>
                        <Box className={uiTokens.filterBar.librarySelectStatus}>
                            <FilterSelect
                                appearance="library"
                                ariaLabel="Filtrer par statut"
                                options={LEARNER_CONTENT_STATUS_FILTER_OPTIONS}
                                value={learnerStatus}
                                onChange={selectLearnerStatus}
                            />
                        </Box>
                </LibraryFilterBar>

                {error && !roleplayToArchive && (
                    <CardSurface className="mb-5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 shadow-none">
                        <Text className={cn("text-[13px] font-semibold", uiTokens.text.danger)}>{error}</Text>
                    </CardSurface>
                )}

                {filteredRoleplays.length > 0 ? (
                    <Box className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredRoleplays.map((roleplay) => {
                            const categoryStyle =
                                categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
                            const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
                            const cardDescription = getCardDescriptionExcerpt(roleplay.description);
                            const cardTitle = roleplay.title || roleplay.category;
                            const attemptCount = roleplay.detail.simulations;
                            const canStart = isSelectableContent(roleplay.status, roleplay.isActive);
                            const attemptLabel = `${attemptCount} tentative${attemptCount === 1 ? "" : "s"} réalisée${attemptCount === 1 ? "" : "s"}`;
                            const bestScoreLabel =
                                attemptCount > 0
                                    ? `${Math.round(roleplay.detail.meilleurScore)}%`
                                    : "—";

                            return (
                                <CardSurface
                                    key={roleplay.id}
                                    className="relative flex flex-col rounded-[16px] border border-[#E5E7EB] shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(17,24,39,0.12)]"
                                >
                                    <Box className={uiTokens.roleplayCard.header}>
                                        <Box
                                            className="absolute left-4 top-4 inline-flex h-5 items-center rounded-lg px-2.5 text-[12px] font-semibold"
                                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                                        >
                                            {roleplay.category}
                                        </Box>
                                        <Box className="absolute right-3 top-3 z-20 flex items-center gap-1.5">
                                            <Tooltip content={attemptLabel}>
                                                <Box
                                                    aria-label={`Nombre de tentatives : ${attemptCount}`}
                                                    className={uiTokens.roleplayCard.attemptBadge}
                                                    tabIndex={0}
                                                >
                                                    <InlineIcon icon={History} className="h-3.5 w-3.5 shrink-0" />
                                                    <Text as="span">{attemptCount}</Text>
                                                </Box>
                                            </Tooltip>
                                            {canManage && (
                                                <Box className="relative">
                                                    <Button
                                                        aria-label={`Actions pour ${roleplay.name}`}
                                                        onClick={() => setOpenMenuId(openMenuId === roleplay.id ? null : roleplay.id)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15"
                                                    >
                                                        <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                                    </Button>
                                                    {openMenuId === roleplay.id && (
                                                        <CardActionMenu>
                                                            <CardActionMenuLink
                                                                href={withReturnTo(ROLEPLAY_ROUTES.app.edit(roleplay.id), currentHref)}
                                                                icon={Edit3}
                                                                label={ENTITY_ACTION_LABELS.modify}
                                                            />
                                                            <CardActionMenuButton
                                                                disabled={busyRoleplayId === roleplay.id}
                                                                icon={Copy}
                                                                label={ENTITY_ACTION_LABELS.duplicate}
                                                                onClick={() => void handleDuplicate(roleplay.id)}
                                                            />
                                                            <CardActionMenuButton
                                                                danger
                                                                disabled={busyRoleplayId === roleplay.id}
                                                                icon={Archive}
                                                                label={ENTITY_ACTION_LABELS.archive}
                                                                onClick={() => {
                                                                    setError(null);
                                                                    setOpenMenuId(null);
                                                                    setRoleplayToArchive(roleplay);
                                                                }}
                                                            />
                                                        </CardActionMenu>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box className={uiTokens.roleplayCard.body}>
                                        <Box className={uiTokens.roleplayCard.avatar}>
                                            <Box
                                                aria-label={roleplay.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                            />
                                        </Box>

                                        <Text as="h3" className={uiTokens.roleplayCard.personaName}>
                                            {roleplay.name}
                                        </Text>
                                        <Text className={uiTokens.roleplayCard.personaMeta}>
                                            {roleplay.role} @ {roleplay.company}
                                        </Text>

                                        <Box className={uiTokens.roleplayCard.badges}>
                                            <Box
                                                className="inline-flex h-[26px] items-center rounded-lg border px-2.5 text-[12px] font-bold"
                                                style={{
                                                    backgroundColor: difficultyStyle.bg,
                                                    borderColor: difficultyStyle.border,
                                                    color: difficultyStyle.text,
                                                }}
                                            >
                                                {roleplay.difficulty}
                                            </Box>
                                            <LearnerContentStatusBadge
                                                status={roleplay.learnerStatus}
                                                className="h-[26px] text-[12px]"
                                            />
                                        </Box>

                                        <Box className={uiTokens.roleplayCard.divider} />

                                        <Box className={uiTokens.roleplayCard.content}>
                                            <Text
                                                title={cardTitle}
                                                className={uiTokens.roleplayCard.title}
                                            >
                                                {cardTitle}
                                            </Text>
                                            <Text
                                                title={roleplay.description}
                                                className={uiTokens.roleplayCard.description}
                                            >
                                                {cardDescription}
                                            </Text>
                                        </Box>

                                        <Box className={uiTokens.roleplayCard.stats}>
                                            <Box className={uiTokens.roleplayCard.stat}>
                                                <Box className={uiTokens.roleplayCard.statLabelRow}>
                                                    <Text as="span" className={uiTokens.roleplayCard.statLabel}>
                                                        Sessions
                                                    </Text>
                                                    <Tooltip content="Nombre de sessions réalisées">
                                                        <Box
                                                            aria-label="Information sur le nombre de sessions"
                                                            className={uiTokens.roleplayCard.statInfo}
                                                            tabIndex={0}
                                                        >
                                                            <InlineIcon
                                                                icon={Info}
                                                                className={uiTokens.roleplayCard.statInfoIcon}
                                                            />
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                                <Text className={uiTokens.roleplayCard.statValue}>
                                                    {attemptCount}
                                                </Text>
                                            </Box>
                                            <Box className={uiTokens.roleplayCard.stat}>
                                                <Box className={uiTokens.roleplayCard.statLabelRow}>
                                                    <Text as="span" className={uiTokens.roleplayCard.statLabel}>
                                                        Meilleur
                                                    </Text>
                                                    <Tooltip content="Meilleur score obtenu">
                                                        <Box
                                                            aria-label="Information sur le meilleur score"
                                                            className={uiTokens.roleplayCard.statInfo}
                                                            tabIndex={0}
                                                        >
                                                            <InlineIcon
                                                                icon={Info}
                                                                className={uiTokens.roleplayCard.statInfoIcon}
                                                            />
                                                        </Box>
                                                    </Tooltip>
                                                </Box>
                                                <Text className={uiTokens.roleplayCard.statValue}>
                                                    {bestScoreLabel}
                                                </Text>
                                            </Box>
                                        </Box>

                                        <ContextualLink
                                            href={ROLEPLAY_ROUTES.app.detail(roleplay.id)}
                                            className={uiTokens.roleplayCard.action}
                                        >
                                            <InlineIcon icon={canStart ? Phone : Eye} className="h-4 w-4" />
                                            {canStart ? "S'entraîner" : "Voir le roleplay"}
                                        </ContextualLink>
                                    </Box>
                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucun roleplay trouvé</Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Ajustez les filtres pour afficher plus de scénarios.
                        </Text>
                    </CardSurface>
                )}

                {roleplayToArchive && (
                    <ArchiveContentConfirmationModal
                        busy={busyRoleplayId === roleplayToArchive.id}
                        entityLabel="le roleplay"
                        error={error}
                        name={roleplayToArchive.title || roleplayToArchive.name}
                        onCancel={() => {
                            setRoleplayToArchive(null);
                            setError(null);
                        }}
                        onConfirm={() => void handleArchive()}
                    />
                )}
            </Box>
        </Box>
    );
}
