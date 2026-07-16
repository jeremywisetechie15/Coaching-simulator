"use client";

import { Archive, ArrowLeft, Copy, Edit3, MoreHorizontal, Plus, UserRoundCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import {
    ArchiveContentConfirmationModal,
    EntityDetailsModalFeedback,
} from "@/features/content/components";
import { requestContentCardAction } from "@/features/content/data/content-card-action.request";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import type { PersonaDetail, PersonaListItem } from "@/features/personas/domain/persona-list";
import { getPersonaInitials } from "@/features/personas/domain/persona-list";
import { PERSONA_ROUTES } from "@/features/personas/domain/persona-routes";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { PersonaDetailsModal } from "./PersonaDetailsModal";

interface PersonasPageContentProps {
    canManage: boolean;
    initialPersonas: PersonaListItem[];
}

interface PersonasPayload {
    error?: string;
    personas?: PersonaListItem[];
}

interface PersonaDetailPayload {
    error?: string;
    persona?: PersonaDetail;
}

const personasQueryKey = ["personas"] as const;

async function fetchPersonas() {
    const response = await fetch("/api/personas", {
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as PersonasPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error ?? "Impossible de charger les personas.");
    }

    return payload?.personas ?? [];
}

async function fetchPersonaDetail(personaId: string) {
    const response = await fetch(PERSONA_ROUTES.api.detail(personaId), {
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as PersonaDetailPayload | null;

    if (!response.ok || !payload?.persona) {
        throw new Error(payload?.error ?? "Impossible de charger le détail du persona.");
    }

    return payload.persona;
}

export function PersonasPageContent({ canManage, initialPersonas }: PersonasPageContentProps) {
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyPersonaId, setBusyPersonaId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [personaToArchive, setPersonaToArchive] = useState<PersonaListItem | null>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const personasQuery = useQuery({
        initialData: initialPersonas,
        queryFn: fetchPersonas,
        queryKey: personasQueryKey,
    });
    const personas = personasQuery.data;
    const personaDetailQuery = useQuery({
        enabled: Boolean(selectedPersonaId),
        queryFn: () => fetchPersonaDetail(selectedPersonaId as string),
        queryKey: ["personas", "detail", selectedPersonaId],
    });

    function openPersonaDetails(personaId: string) {
        setOpenMenuId(null);
        setSelectedPersonaId(personaId);
    }

    async function handleDuplicate(personaId: string) {
        setActionError(null);
        setBusyPersonaId(personaId);

        try {
            await requestContentCardAction(
                PERSONA_ROUTES.api.duplicate(personaId),
                "POST",
                "Impossible de dupliquer le persona.",
            );
            setOpenMenuId(null);
            await personasQuery.refetch();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible de dupliquer le persona.");
        } finally {
            setBusyPersonaId(null);
        }
    }

    async function handleArchive() {
        if (!personaToArchive) return;

        setActionError(null);
        setBusyPersonaId(personaToArchive.id);

        try {
            await requestContentCardAction(
                PERSONA_ROUTES.api.detail(personaToArchive.id),
                "DELETE",
                "Impossible d'archiver le persona.",
            );
            setPersonaToArchive(null);
            setSelectedPersonaId((currentId) => currentId === personaToArchive.id ? null : currentId);
            await personasQuery.refetch();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible d'archiver le persona.");
        } finally {
            setBusyPersonaId(null);
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
                                Mes Personas IA
                            </Text>
                            <Text className="mt-2 max-w-[780px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Créez et gérez vos personas IA pour vos scénarios de roleplay et de formation
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <ContextualLink
                            href="/personas/new"
                            className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer un persona IA
                        </ContextualLink>
                    )}
                </Box>

                {personasQuery.isError && (
                    <Box className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]">
                        {personasQuery.error.message}
                    </Box>
                )}

                {actionError && !personaToArchive && (
                    <CardSurface className={cn("mb-5 rounded-xl border px-4 py-3 shadow-none", uiTokens.tone.danger.soft)}>
                        <Text className="text-[13px] font-semibold">{actionError}</Text>
                    </CardSurface>
                )}

                {personas.length > 0 ? (
                    <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {personas.map((persona) => {
                            const isMenuOpen = openMenuId === persona.id;

                            return (
                                <CardSurface
                                    key={persona.id}
                                    aria-label={`Voir les informations de ${persona.name}`}
                                    aria-haspopup="dialog"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openPersonaDetails(persona.id)}
                                    onKeyDown={(event) => {
                                        if (event.target !== event.currentTarget) return;
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            openPersonaDetails(persona.id);
                                        }
                                    }}
                                    className="relative min-h-[218px] cursor-pointer rounded-[14px] border border-[#E1E4EB] px-5 py-6 text-center shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40"
                                >
                                    {canManage && (
                                        <Box
                                            className="absolute right-4 top-4 z-10"
                                            onClick={(event) => event.stopPropagation()}
                                            onKeyDown={(event) => event.stopPropagation()}
                                        >
                                            <Button
                                                aria-label={`Actions pour ${persona.name}`}
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : persona.id)}
                                                className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
                                            >
                                                <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
                                            </Button>
                                            {isMenuOpen && (
                                                <CardActionMenu>
                                                    <CardActionMenuLink
                                                        href={PERSONA_ROUTES.app.edit(persona.id)}
                                                        icon={Edit3}
                                                        label={ENTITY_ACTION_LABELS.modify}
                                                    />
                                                    <CardActionMenuButton
                                                        disabled={busyPersonaId === persona.id}
                                                        icon={Copy}
                                                        label={ENTITY_ACTION_LABELS.duplicate}
                                                        onClick={() => void handleDuplicate(persona.id)}
                                                    />
                                                    <CardActionMenuButton
                                                        danger
                                                        disabled={busyPersonaId === persona.id}
                                                        icon={Archive}
                                                        label={ENTITY_ACTION_LABELS.archive}
                                                        onClick={() => {
                                                            setActionError(null);
                                                            setOpenMenuId(null);
                                                            setPersonaToArchive(persona);
                                                        }}
                                                    />
                                                </CardActionMenu>
                                            )}
                                        </Box>
                                    )}

                                    <Box className="mx-auto mb-5 flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7EAFF] bg-[#F1F2F6]">
                                        {persona.avatarUrl ? (
                                            <Box
                                                aria-label={persona.name}
                                                role="img"
                                                className="h-full w-full bg-cover bg-center"
                                                style={{ backgroundImage: `url(${persona.avatarUrl})` }}
                                            />
                                        ) : (
                                            <Text className="text-[20px] font-extrabold text-[#5140F0]">
                                                {getPersonaInitials(persona.name)}
                                            </Text>
                                        )}
                                    </Box>

                                    <Text as="h2" className="text-[19px] font-extrabold leading-6 text-[#111827]">
                                        {persona.name}
                                    </Text>
                                    <Text className="mt-3 text-[14px] font-bold leading-5 text-[#596273]">
                                        {persona.role || "Fonction non renseignée"}
                                    </Text>
                                    <Text className="mt-1.5 text-[13px] font-semibold leading-5 text-[#747C8C]">
                                        {persona.company || "Entreprise non renseignée"}
                                    </Text>
                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E1E4EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={UserRoundCog} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">
                            Aucun persona IA trouvé
                        </Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Créez votre premier persona pour alimenter vos scénarios.
                        </Text>
                    </CardSurface>
                )}

                {selectedPersonaId && !personaDetailQuery.data && (
                    <EntityDetailsModalFeedback
                        title="Détail du persona"
                        error={personaDetailQuery.error?.message}
                        onClose={() => setSelectedPersonaId(null)}
                    />
                )}
                {selectedPersonaId && personaDetailQuery.data && (
                    <PersonaDetailsModal
                        persona={personaDetailQuery.data}
                        onClose={() => setSelectedPersonaId(null)}
                    />
                )}
                {personaToArchive && (
                    <ArchiveContentConfirmationModal
                        busy={busyPersonaId === personaToArchive.id}
                        entityLabel="le persona"
                        error={actionError}
                        name={personaToArchive.name}
                        onCancel={() => {
                            setActionError(null);
                            setPersonaToArchive(null);
                        }}
                        onConfirm={() => void handleArchive()}
                    />
                )}
            </Box>
        </Box>
    );
}
