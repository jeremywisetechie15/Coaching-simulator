"use client";

import Link from "next/link";
import { ArrowLeft, Copy, MoreVertical, Pencil, Plus, Trash2, UserRoundCog } from "lucide-react";
import { useMemo, useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { getPersonaInitials } from "@/features/personas/domain/persona-list";

interface PersonasPageContentProps {
    personas: PersonaListItem[];
}

function badgeClasses(label: PersonaListItem["influenceLabel"]) {
    return label === "Influent"
        ? "bg-[#FFF4C9] text-[#B77900]"
        : "bg-[#DCF8E6] text-[#2F9447]";
}

export function PersonasPageContent({ personas }: PersonasPageContentProps) {
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const sortedPersonas = useMemo(() => personas, [personas]);

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-9 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <Link
                            href="/organizations"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Box>
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Mes Personas IA
                            </Text>
                            <Text className="mt-2 max-w-[780px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Créez et gérez vos personas IA pour vos scénarios de roleplay et de formation
                            </Text>
                        </Box>
                    </Box>

                    <Button className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2">
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Créer un persona IA
                    </Button>
                </Box>

                {sortedPersonas.length > 0 ? (
                    <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {sortedPersonas.map((persona) => {
                            const isMenuOpen = openMenuId === persona.id;

                            return (
                                <CardSurface
                                    key={persona.id}
                                    className="relative min-h-[218px] rounded-[14px] border border-[#E1E4EB] px-5 py-6 text-center shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                                >
                                    <Button
                                        aria-label={`Actions pour ${persona.name}`}
                                        onClick={() => setOpenMenuId(isMenuOpen ? null : persona.id)}
                                        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-[#596273] transition hover:bg-[#F3F4F8] hover:text-[#111827]"
                                    >
                                        <InlineIcon icon={MoreVertical} className="h-4 w-4" />
                                    </Button>

                                    {isMenuOpen && (
                                        <CardSurface className="absolute right-5 top-12 z-10 w-max rounded-lg border border-[#E1E4EB] px-1 py-1.5 text-left shadow-[0_12px_28px_rgba(17,24,39,0.14)]">
                                            {[
                                                { icon: Copy, label: "Dupliquer" },
                                                { icon: Pencil, label: "Éditer" },
                                                { icon: Trash2, label: "Supprimer" },
                                            ].map((item) => (
                                                <Button
                                                    key={item.label}
                                                    className="flex h-7 w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 text-[12px] font-semibold text-[#111827] transition hover:bg-[#F7F8FB]"
                                                >
                                                    <InlineIcon icon={item.icon} className="h-3.5 w-3.5 text-[#737B8E]" />
                                                    {item.label}
                                                </Button>
                                            ))}
                                        </CardSurface>
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
                                        {persona.role || "Persona IA"}
                                    </Text>
                                    <Text className="mt-1.5 text-[12px] font-bold uppercase leading-5 text-[#747C8C]">
                                        {persona.company || "Entreprise"}
                                    </Text>
                                    <Box
                                        className={`mt-4 inline-flex h-7 items-center rounded-lg px-3 text-[12px] font-extrabold ${badgeClasses(persona.influenceLabel)}`}
                                    >
                                        {persona.influenceLabel}
                                    </Box>
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
            </Box>
        </Box>
    );
}
