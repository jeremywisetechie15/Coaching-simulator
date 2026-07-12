"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    AlertTriangle,
    ClipboardList,
    Copy,
    Edit3,
    ListChecks,
    MoreHorizontal,
    Plus,
    Search,
    Target,
    Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContextualLink, useCurrentAppHref } from "@/features/app-shell/components";
import { withReturnTo, withSearchParams } from "@/features/app-shell/domain";
import { CONTENT_DOMAINS } from "@/features/content/domain";
import { getQuizStatusLabel } from "@/features/evaluations/domain";
import { SCORECARD_ROUTES, SCORECARD_VISIBILITY_LABELS, type ScorecardListItem } from "@/features/scorecards/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface ScorecardsPageContentProps {
    canManage: boolean;
    scorecards: ScorecardListItem[];
}

interface ApiErrorPayload {
    error?: string;
}

async function duplicateScorecardRequest(scorecardId: string) {
    const response = await fetch(SCORECARD_ROUTES.api.duplicate(scorecardId), { method: "POST" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de dupliquer la scorecard.");
    }
}

async function deleteScorecardRequest(scorecardId: string) {
    const response = await fetch(SCORECARD_ROUTES.api.detail(scorecardId), { method: "DELETE" });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error || "Impossible de supprimer la scorecard.");
    }
}

export function ScorecardsPageContent({ canManage, scorecards }: ScorecardsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const domainOptions = ["all", ...CONTENT_DOMAINS];
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [domain, setDomain] = useState(
        domainOptions.includes(searchParams.get("domain") ?? "") ? searchParams.get("domain")! : "all",
    );
    const [busyScorecardId, setBusyScorecardId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [scorecardToDelete, setScorecardToDelete] = useState<ScorecardListItem | null>(null);

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

            return matchesTerm && matchesDomain;
        });
    }, [domain, query, scorecards]);

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

    async function handleDelete() {
        if (!scorecardToDelete) return;

        setError(null);
        setBusyScorecardId(scorecardToDelete.id);

        try {
            await deleteScorecardRequest(scorecardToDelete.id);
            setScorecardToDelete(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de supprimer la scorecard.");
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
        router.replace(withSearchParams(currentHref, { domain: value === "all" ? null : value }), {
            scroll: false,
        });
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className={uiTokens.surface.pageBanner}>
                    <Text as="h1" className={cn("text-[22px] font-extrabold leading-tight", uiTokens.text.heading)}>
                        Scorecards
                    </Text>
                    {canManage && (
                        <ContextualLink
                            href="/scorecards/new"
                            className={cn(
                                "flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-bold text-white transition",
                                uiTokens.action.primaryButton,
                            )}
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer une scorecard
                        </ContextualLink>
                    )}
                </Box>

                <CardSurface className={cn("mt-6", uiTokens.surface.listToolbar)}>
                    <Box className="grid gap-3 lg:grid-cols-[1fr_220px]">
                        <Box className="relative">
                            <InlineIcon
                                icon={Search}
                                className={cn("pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2", uiTokens.text.muted)}
                            />
                            <input
                                type="search"
                                value={query}
                                onChange={(event) => updateQuery(event.target.value)}
                                placeholder="Rechercher une scorecard..."
                                className={cn(uiTokens.form.control, "h-11 pl-11 text-[14px]")}
                            />
                        </Box>
                        <select
                            value={domain}
                            onChange={(event) => updateDomain(event.target.value)}
                            className={cn(uiTokens.form.control, "h-11 px-3 text-[14px]")}
                        >
                            {domainOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === "all" ? "Tous les domaines" : option}
                                </option>
                            ))}
                        </select>
                    </Box>
                </CardSurface>

                {error && (
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
                    <Box className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filtered.map((scorecard) => (
                            <ScorecardCard
                                key={scorecard.id}
                                busy={busyScorecardId === scorecard.id}
                                isMenuOpen={openMenuId === scorecard.id}
                                onDelete={() => {
                                    setError(null);
                                    setOpenMenuId(null);
                                    setScorecardToDelete(scorecard);
                                }}
                                onDuplicate={() => void handleDuplicate(scorecard.id)}
                                onToggleMenu={() => setOpenMenuId(openMenuId === scorecard.id ? null : scorecard.id)}
                                showActions={canManage}
                                scorecard={scorecard}
                            />
                        ))}
                    </Box>
                )}

                {scorecardToDelete && (
                    <Modal
                        title="Supprimer la scorecard"
                        description={`Confirmez la suppression de ${scorecardToDelete.name}.`}
                        onClose={() => {
                            if (busyScorecardId) return;
                            setScorecardToDelete(null);
                            setError(null);
                        }}
                        className="max-w-[500px]"
                    >
                        <Box className="space-y-5">
                            <Box className={cn("flex gap-3 rounded-xl border p-4", uiTokens.tone.warning.soft)}>
                                <InlineIcon icon={AlertTriangle} className="mt-0.5 h-5 w-5 shrink-0" />
                                <Text className="text-[13px] font-semibold leading-6">
                                    {"Cette action retire la scorecard des listes actives. Elle est bloquée si la scorecard est déjà associée à un roleplay."}
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
                                    disabled={Boolean(busyScorecardId)}
                                    onClick={() => {
                                        setScorecardToDelete(null);
                                        setError(null);
                                    }}
                                    className={uiTokens.action.secondaryButton}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    disabled={Boolean(busyScorecardId)}
                                    onClick={() => void handleDelete()}
                                    className={uiTokens.action.dangerButton}
                                >
                                    {busyScorecardId === scorecardToDelete.id ? "Suppression..." : "Supprimer"}
                                </Button>
                            </Box>
                        </Box>
                    </Modal>
                )}
            </Box>
        </Box>
    );
}

interface ScorecardCardProps {
    busy: boolean;
    isMenuOpen: boolean;
    onDelete: () => void;
    onDuplicate: () => void;
    onToggleMenu: () => void;
    scorecard: ScorecardListItem;
    showActions: boolean;
}

function ScorecardCard({
    busy,
    isMenuOpen,
    onDelete,
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
                            <CardActionMenuButton
                                danger
                                disabled={busy}
                                icon={Trash2}
                                label={ENTITY_ACTION_LABELS.delete}
                                onClick={onDelete}
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
                        {getQuizStatusLabel(scorecard.status)}
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
