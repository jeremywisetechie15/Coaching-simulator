"use client";

import { ArrowLeft, BotMessageSquare, Copy, Edit3, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import {
    DeleteContentConfirmationModal,
    EntityDetailsModalFeedback,
} from "@/features/content/components";
import { requestContentCardAction } from "@/features/content/data/content-card-action.request";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { getCoachInitials, type CoachDetail, type CoachListItem } from "@/features/coaches/domain/coach-list";
import { COACH_ROUTES } from "@/features/coaches/domain/coach-routes";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { CoachDetailsModal } from "./CoachDetailsModal";
import { CoachCardBadges } from "./CoachCardBadges";

interface CoachesPageContentProps {
    canManage: boolean;
    initialCoaches: CoachListItem[];
}

interface CoachesPayload {
    coaches?: CoachListItem[];
    error?: string;
}

interface CoachDetailPayload {
    coach?: CoachDetail;
    error?: string;
}

const coachesQueryKey = ["coaches"] as const;

async function fetchCoaches() {
    const response = await fetch("/api/coaches", {
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as CoachesPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error ?? "Impossible de charger les coachs IA.");
    }

    return payload?.coaches ?? [];
}

async function fetchCoachDetail(coachId: string) {
    const response = await fetch(COACH_ROUTES.api.detail(coachId), {
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as CoachDetailPayload | null;

    if (!response.ok || !payload?.coach) {
        throw new Error(payload?.error ?? "Impossible de charger le détail du coach.");
    }

    return payload.coach;
}

export function CoachesPageContent({ canManage, initialCoaches }: CoachesPageContentProps) {
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyCoachId, setBusyCoachId] = useState<string | null>(null);
    const [coachToDelete, setCoachToDelete] = useState<CoachListItem | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
    const coachesQuery = useQuery({
        initialData: initialCoaches,
        queryFn: fetchCoaches,
        queryKey: coachesQueryKey,
    });
    const coaches = coachesQuery.data;
    const coachDetailQuery = useQuery({
        enabled: Boolean(selectedCoachId),
        queryFn: () => fetchCoachDetail(selectedCoachId as string),
        queryKey: ["coaches", "detail", selectedCoachId],
    });

    function openCoachDetails(coachId: string) {
        setOpenMenuId(null);
        setSelectedCoachId(coachId);
    }

    async function handleDuplicate(coachId: string) {
        setActionError(null);
        setBusyCoachId(coachId);

        try {
            await requestContentCardAction(
                COACH_ROUTES.api.duplicate(coachId),
                "POST",
                "Impossible de dupliquer le coach.",
            );
            setOpenMenuId(null);
            await coachesQuery.refetch();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible de dupliquer le coach.");
        } finally {
            setBusyCoachId(null);
        }
    }

    async function handleDelete() {
        if (!coachToDelete) return;

        setActionError(null);
        setBusyCoachId(coachToDelete.id);

        try {
            await requestContentCardAction(
                COACH_ROUTES.api.detail(coachToDelete.id),
                "DELETE",
                "Impossible de supprimer le coach.",
            );
            setCoachToDelete(null);
            setSelectedCoachId((currentId) => currentId === coachToDelete.id ? null : currentId);
            await coachesQuery.refetch();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible de supprimer le coach.");
        } finally {
            setBusyCoachId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-9 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <ContextualBackLink
                            fallbackHref="/"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Box>
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Mes Coachs IA
                            </Text>
                            <Text className="mt-2 max-w-[640px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Gérez vos coachs virtuels pour vos programmes de formation et roleplays
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <ContextualLink
                            href="/coaches/new"
                            className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer un coach IA
                        </ContextualLink>
                    )}
                </Box>

                {coachesQuery.isError && (
                    <Box className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]">
                        {coachesQuery.error.message}
                    </Box>
                )}

                {actionError && !coachToDelete && (
                    <CardSurface className={cn("mb-5 rounded-xl border px-4 py-3 shadow-none", uiTokens.tone.danger.soft)}>
                        <Text className="text-[13px] font-semibold">{actionError}</Text>
                    </CardSurface>
                )}

                {coaches.length > 0 ? (
                    <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {coaches.map((coach) => {
                            const isMenuOpen = openMenuId === coach.id;

                            return (
                                <CardSurface
                                    key={coach.id}
                                    aria-label={`Voir les informations de ${coach.name}`}
                                    aria-haspopup="dialog"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openCoachDetails(coach.id)}
                                    onKeyDown={(event) => {
                                        if (event.target !== event.currentTarget) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openCoachDetails(coach.id);
                                        }
                                    }}
                                    className="relative cursor-pointer rounded-[14px] border border-[#E1E4EB] px-5 pb-6 pt-5 text-center shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40"
                                >
                                    <Box className="flex items-start justify-between">
                                        <Box className="inline-flex h-7 items-center rounded-full bg-[#5140F0] px-3.5 text-[12px] font-bold text-white">
                                            Mon Coach
                                        </Box>
                                        {canManage && (
                                            <Box
                                                className="relative z-10"
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => event.stopPropagation()}
                                            >
                                                <Button
                                                    aria-label={`Actions pour ${coach.name}`}
                                                    onClick={() => setOpenMenuId(isMenuOpen ? null : coach.id)}
                                                    className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                                                >
                                                    <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                                </Button>
                                                {isMenuOpen && (
                                                    <CardActionMenu>
                                                        <CardActionMenuLink
                                                            href={COACH_ROUTES.app.edit(coach.id)}
                                                            icon={Edit3}
                                                            label={ENTITY_ACTION_LABELS.modify}
                                                        />
                                                        <CardActionMenuButton
                                                            disabled={busyCoachId === coach.id}
                                                            icon={Copy}
                                                            label={ENTITY_ACTION_LABELS.duplicate}
                                                            onClick={() => void handleDuplicate(coach.id)}
                                                        />
                                                        <CardActionMenuButton
                                                            danger
                                                            disabled={busyCoachId === coach.id}
                                                            icon={Trash2}
                                                            label={ENTITY_ACTION_LABELS.delete}
                                                            onClick={() => {
                                                                setActionError(null);
                                                                setOpenMenuId(null);
                                                                setCoachToDelete(coach);
                                                            }}
                                                        />
                                                    </CardActionMenu>
                                                )}
                                            </Box>
                                        )}
                                    </Box>

                                    <Box className="mx-auto mt-2 flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7EAFF] bg-[#F1F2F6]">
                                        {coach.avatarSrc ? (
                                            <Box
                                                aria-label={coach.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${coach.avatarSrc})` }}
                                            />
                                        ) : (
                                            <Text className="text-[24px] font-extrabold text-[#5140F0]">
                                                {getCoachInitials(coach.name)}
                                            </Text>
                                        )}
                                    </Box>

                                    <Text as="h3" className="mt-4 text-[21px] font-extrabold leading-7 text-[#111827]">
                                        {coach.name}
                                    </Text>

                                    <CoachCardBadges coach={coach} />

                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E1E4EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={BotMessageSquare} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucun coach IA trouvé</Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Créez votre premier coach pour accompagner vos formations.
                        </Text>
                    </CardSurface>
                )}

                {selectedCoachId && !coachDetailQuery.data && (
                    <EntityDetailsModalFeedback
                        title="Détail du coach"
                        error={coachDetailQuery.error?.message}
                        onClose={() => setSelectedCoachId(null)}
                    />
                )}
                {selectedCoachId && coachDetailQuery.data && (
                    <CoachDetailsModal
                        coach={coachDetailQuery.data}
                        onClose={() => setSelectedCoachId(null)}
                    />
                )}
                {coachToDelete && (
                    <DeleteContentConfirmationModal
                        busy={busyCoachId === coachToDelete.id}
                        entityLabel="le coach"
                        error={actionError}
                        name={coachToDelete.name}
                        onCancel={() => {
                            setActionError(null);
                            setCoachToDelete(null);
                        }}
                        onConfirm={() => void handleDelete()}
                    />
                )}
            </Box>
        </Box>
    );
}
