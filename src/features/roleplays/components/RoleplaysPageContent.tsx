"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Copy, Edit3, History, MoreHorizontal, Phone, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
    ContextualBackLink,
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withReturnTo, withSearchParams } from "@/features/app-shell/domain";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    discBadgeStyles,
    filterRoleplaysByLibraryFilters,
    getRoleplayCategoryFilterOptions,
    roleplayCategoryFilterOptions,
    roleplayDiscFilterOptions,
    roleplayDomainFilterOptions,
    roleplayLevelFilterOptions,
} from "@/features/roleplays/data/roleplays";
import type { RoleplayItem } from "@/features/roleplays/data/roleplays";
import { ROLEPLAY_ROUTES } from "@/features/roleplays/domain";
import { Box, Button, CardSurface, InlineIcon, Text, Tooltip } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink, FilterSelect } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
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

async function deleteRoleplayRequest(roleplayId: string) {
    const response = await fetch(ROLEPLAY_ROUTES.api.detail(roleplayId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de supprimer le roleplay.");
    }
}

export function RoleplaysPageContent({ canManage, roleplays }: RoleplaysPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
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
    const [disc, setDisc] = useState(
        roleplayDiscFilterOptions.includes(searchParams.get("disc") ?? "")
            ? searchParams.get("disc")!
            : roleplayDiscFilterOptions[0],
    );
    const [busyRoleplayId, setBusyRoleplayId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [roleplayToDelete, setRoleplayToDelete] = useState<RoleplayItem | null>(null);

    const categoryOptions = useMemo(() => getRoleplayCategoryFilterOptions(domain), [domain]);
    const filteredRoleplays = useMemo(
        () => filterRoleplaysByLibraryFilters(roleplays, { category, disc, domain, level }),
        [category, disc, domain, level, roleplays],
    );

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
        key: "category" | "disc" | "level",
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

    async function handleDelete() {
        if (!roleplayToDelete) return;

        setError(null);
        setBusyRoleplayId(roleplayToDelete.id);

        try {
            await deleteRoleplayRequest(roleplayToDelete.id);
            setRoleplayToDelete(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de supprimer le roleplay.");
        } finally {
            setBusyRoleplayId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex items-start gap-4 md:gap-6">
                    <ContextualBackLink
                        fallbackHref="/"
                        aria-label="Retour"
                        className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Box className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <Box className="min-w-0">
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Bibliothèque de Roleplays
                            </Text>
                            <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#596273]">
                                Pratiquez vos compétences avec des scénarios réalistes
                            </Text>
                        </Box>
                        <ContextualLink
                            href={ROLEPLAY_ROUTES.app.history}
                            className="flex h-11 shrink-0 items-center justify-center rounded-xl border border-[#C9C2FB] bg-white px-6 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                        >
                            Historique des sessions
                        </ContextualLink>
                    </Box>
                </Box>

                <CardSurface className="mb-7 rounded-[16px] border border-[#E9E7FB] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <Box className="flex flex-wrap items-center gap-3">
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect ariaLabel="Filtrer par domaine" options={roleplayDomainFilterOptions} value={domain} onChange={selectDomain} />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect
                                ariaLabel="Filtrer par catégorie"
                                options={categoryOptions}
                                value={category}
                                onChange={(value) =>
                                    selectFilter("category", value, roleplayCategoryFilterOptions[0], setCategory)
                                }
                            />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect
                                ariaLabel="Filtrer par niveau"
                                options={roleplayLevelFilterOptions}
                                value={level}
                                onChange={(value) => selectFilter("level", value, roleplayLevelFilterOptions[0], setLevel)}
                            />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect
                                ariaLabel="Filtrer par profil DISC"
                                options={roleplayDiscFilterOptions}
                                value={disc}
                                onChange={(value) => selectFilter("disc", value, roleplayDiscFilterOptions[0], setDisc)}
                            />
                        </Box>
                        {canManage && (
                            <ContextualLink
                                href="/roleplays/new"
                                className="ml-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                            >
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Créer un scénario
                            </ContextualLink>
                        )}
                    </Box>
                </CardSurface>

                {error && !roleplayToDelete && (
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
                            const discStyle = discBadgeStyles[roleplay.disc];
                            const cardDescription = getCardDescriptionExcerpt(roleplay.description);
                            const cardTitle = roleplay.title || roleplay.category;
                            const attemptCount = roleplay.detail.simulations;
                            const attemptLabel = `${attemptCount} tentative${attemptCount === 1 ? "" : "s"} réalisée${attemptCount === 1 ? "" : "s"}`;

                            return (
                                <CardSurface
                                    key={roleplay.id}
                                    className="relative flex flex-col rounded-[16px] border border-[#E5E7EB] shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(17,24,39,0.12)]"
                                >
                                    <Box className="relative h-[92px] rounded-t-[16px] bg-gradient-to-b from-[#6A57F5] to-[#5B49F2]">
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
                                                                label="Modifier"
                                                            />
                                                            <CardActionMenuButton
                                                                disabled={busyRoleplayId === roleplay.id}
                                                                icon={Copy}
                                                                label="Dupliquer"
                                                                onClick={() => void handleDuplicate(roleplay.id)}
                                                            />
                                                            <CardActionMenuButton
                                                                danger
                                                                disabled={busyRoleplayId === roleplay.id}
                                                                icon={Trash2}
                                                                label="Supprimer"
                                                                onClick={() => {
                                                                    setError(null);
                                                                    setOpenMenuId(null);
                                                                    setRoleplayToDelete(roleplay);
                                                                }}
                                                            />
                                                        </CardActionMenu>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box className="-mt-[46px] flex flex-1 flex-col items-center px-6 pb-6">
                                        <Box className="relative z-10 h-[92px] w-[92px] overflow-hidden rounded-full border-4 border-white bg-[#F1F2F6] shadow-[0_8px_20px_rgba(17,24,39,0.14)]">
                                            <Box
                                                aria-label={roleplay.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${roleplay.avatarSrc})` }}
                                            />
                                        </Box>

                                        <Text as="h3" className="mt-3 text-[19px] font-extrabold leading-6 text-[#111827]">
                                            {roleplay.name}
                                        </Text>
                                        <Text className="mt-1 text-[14px] font-semibold text-[#596273]">
                                            {roleplay.role}
                                        </Text>
                                        <Text className="mt-0.5 text-[13px] font-semibold text-[#9CA3AF]">
                                            @ {roleplay.company}
                                        </Text>

                                        <Box className="mt-3 flex items-center gap-2">
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
                                            <Box
                                                className="inline-flex h-[26px] items-center rounded-lg px-2.5 text-[12px] font-bold"
                                                style={{ backgroundColor: discStyle.bg, color: discStyle.text }}
                                            >
                                                {roleplay.disc}
                                            </Box>
                                        </Box>

                                        <Box className="my-4 h-px w-full bg-[#ECEEF3]" />

                                        <Box className="flex-1 text-center">
                                            <Text
                                                title={cardTitle}
                                                className="text-[14px] font-extrabold leading-5 text-[#111827]"
                                            >
                                                {cardTitle}
                                            </Text>
                                            <Text
                                                title={roleplay.description}
                                                className="mt-1 text-[14px] font-medium leading-6 text-[#4B5563]"
                                            >
                                                {cardDescription}
                                            </Text>
                                        </Box>

                                        <ContextualLink
                                            href={ROLEPLAY_ROUTES.app.detail(roleplay.id)}
                                            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] text-[14px] font-semibold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                        >
                                            <InlineIcon icon={Phone} className="h-4 w-4" />
                                            S&apos;entraîner
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

                {roleplayToDelete && (
                    <Modal
                        title="Supprimer le roleplay"
                        description={`Confirmez la suppression de ${roleplayToDelete.title || roleplayToDelete.name}.`}
                        onClose={() => {
                            if (busyRoleplayId) return;
                            setRoleplayToDelete(null);
                            setError(null);
                        }}
                        className="max-w-[500px]"
                    >
                        <Box className="space-y-5">
                            <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                                <InlineIcon icon={AlertTriangle} className="mt-0.5 h-5 w-5 shrink-0" />
                                <Text className="text-[13px] font-semibold leading-6">
                                    Cette action retire le roleplay des listes actives. Les sessions déjà réalisées restent conservées.
                                </Text>
                            </Box>

                            {error && (
                                <Box
                                    aria-live="polite"
                                    className={cn(
                                        "rounded-lg border px-4 py-3 text-[13px] font-semibold",
                                        uiTokens.tone.danger.soft,
                                    )}
                                >
                                    {error}
                                </Box>
                            )}

                            <Box className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    disabled={Boolean(busyRoleplayId)}
                                    onClick={() => {
                                        setRoleplayToDelete(null);
                                        setError(null);
                                    }}
                                    className={uiTokens.action.secondaryButton}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    disabled={Boolean(busyRoleplayId)}
                                    onClick={() => void handleDelete()}
                                    className={uiTokens.action.dangerButton}
                                >
                                    {busyRoleplayId === roleplayToDelete.id ? "Suppression..." : "Supprimer"}
                                </Button>
                            </Box>
                        </Box>
                    </Modal>
                )}
            </Box>
        </Box>
    );
}
