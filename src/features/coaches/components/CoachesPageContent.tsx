"use client";

import { ArrowLeft, BotMessageSquare, MoreVertical, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ContextualBackLink, ContextualLink } from "@/features/app-shell/components";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { getCoachInitials, type CoachListItem } from "@/features/coaches/domain/coach-list";

interface CoachesPageContentProps {
    canManage: boolean;
    initialCoaches: CoachListItem[];
}

interface CoachesPayload {
    coaches?: CoachListItem[];
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

export function CoachesPageContent({ canManage, initialCoaches }: CoachesPageContentProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const coachesQuery = useQuery({
        initialData: initialCoaches,
        queryFn: fetchCoaches,
        queryKey: coachesQueryKey,
    });
    const coaches = coachesQuery.data;

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

                {coaches.length > 0 ? (
                    <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {coaches.map((coach) => {
                            const isMenuOpen = openMenuId === coach.id;

                            return (
                                <CardSurface
                                    key={coach.id}
                                    className="relative rounded-[14px] border border-[#E1E4EB] px-5 pb-6 pt-5 text-center shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                                >
                                    <Box className="flex items-start justify-between">
                                        <Box className="inline-flex h-7 items-center rounded-full bg-[#5140F0] px-3.5 text-[12px] font-bold text-white">
                                            Coach IA
                                        </Box>
                                        {canManage && (
                                            <Button
                                                aria-label={`Actions pour ${coach.name}`}
                                                onClick={() => setOpenMenuId(isMenuOpen ? null : coach.id)}
                                                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#596273] transition hover:bg-[#F3F4F8] hover:text-[#111827]"
                                            >
                                                <InlineIcon icon={MoreVertical} className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </Box>

                                    {canManage && isMenuOpen && (
                                        <CardSurface className="absolute right-5 top-14 z-10 w-max rounded-lg border border-[#E1E4EB] px-1 py-1.5 text-left shadow-[0_12px_28px_rgba(17,24,39,0.14)]">
                                            <ContextualLink
                                                href={`/coaches/${coach.id}`}
                                                className="flex h-7 w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 text-[12px] font-semibold text-[#111827] transition hover:bg-[#F7F8FB]"
                                            >
                                                <InlineIcon icon={Pencil} className="h-3.5 w-3.5 text-[#737B8E]" />
                                                Éditer
                                            </ContextualLink>
                                        </CardSurface>
                                    )}

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

                                    <Box className="mt-3 flex flex-col items-center gap-1.5">
                                        <Box className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#E1E4EB] bg-white px-3.5 text-[13px] font-bold text-[#111827]">
                                            {coach.voiceName}
                                            {coach.voiceId && (
                                                <Text as="span" className="text-[12px] font-semibold text-[#737B8E]">
                                                    {coach.voiceId}
                                                </Text>
                                            )}
                                        </Box>
                                        {coach.voiceCharacteristic && (
                                            <Text className="text-[12px] font-semibold text-[#737B8E]">
                                                {coach.voiceCharacteristic}
                                            </Text>
                                        )}
                                    </Box>

                                    {coach.createdAt && (
                                        <Text className="mt-5 text-[13px] font-semibold text-[#737B8E]">
                                            Créé le {coach.createdAt}
                                        </Text>
                                    )}
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
            </Box>
        </Box>
    );
}
