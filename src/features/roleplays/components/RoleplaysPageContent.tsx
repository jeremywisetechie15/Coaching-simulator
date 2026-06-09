"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, MoreVertical, Phone, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    categoryBadgeStyles,
    difficultyBadgeStyles,
    discBadgeStyles,
    roleplayCategoryFilterOptions,
    roleplayDiscFilterOptions,
    roleplayDomainFilterOptions,
    roleplayLevelFilterOptions,
    roleplays,
} from "@/features/roleplays/data/roleplays";

function FilterSelect({
    options,
    value,
    onChange,
}: {
    options: string[];
    value: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} className="relative">
            <Button
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[14px] font-medium text-[#374151] transition hover:border-[#D5D7DE]"
            >
                <Text as="span">{value}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && (
                <CardSurface className="absolute left-0 right-0 top-[48px] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {options.map((option) => (
                        <Button
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setOpen(false);
                            }}
                            className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB] ${
                                option === value ? "text-[#5140F0]" : "text-[#111827]"
                            }`}
                        >
                            <Text as="span">{option}</Text>
                            {option === value && <InlineIcon icon={Check} className="h-4 w-4 shrink-0 text-[#5140F0]" />}
                        </Button>
                    ))}
                </CardSurface>
            )}
        </div>
    );
}

export function RoleplaysPageContent() {
    const [domain, setDomain] = useState(roleplayDomainFilterOptions[0]);
    const [category, setCategory] = useState(roleplayCategoryFilterOptions[0]);
    const [level, setLevel] = useState(roleplayLevelFilterOptions[0]);
    const [disc, setDisc] = useState(roleplayDiscFilterOptions[0]);

    const filteredRoleplays = useMemo(
        () =>
            roleplays.filter((roleplay) => {
                const matchesCategory =
                    category === roleplayCategoryFilterOptions[0] || roleplay.category === category;
                const matchesLevel = level === roleplayLevelFilterOptions[0] || roleplay.difficulty === level;
                const matchesDisc = disc === roleplayDiscFilterOptions[0] || roleplay.disc === disc;
                return matchesCategory && matchesLevel && matchesDisc;
            }),
        [category, level, disc],
    );

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex items-start gap-6">
                    <Link
                        href="/"
                        aria-label="Retour"
                        className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Box>
                        <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                            Bibliothèque de Roleplays
                        </Text>
                        <Text className="mt-2 text-[15px] font-semibold leading-6 text-[#596273]">
                            Pratiquez vos compétences avec des scénarios réalistes
                        </Text>
                    </Box>
                </Box>

                <CardSurface className="mb-7 rounded-[16px] border border-[#E9E7FB] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
                    <Box className="flex flex-wrap items-center gap-3">
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect options={roleplayDomainFilterOptions} value={domain} onChange={setDomain} />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect
                                options={roleplayCategoryFilterOptions}
                                value={category}
                                onChange={setCategory}
                            />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect options={roleplayLevelFilterOptions} value={level} onChange={setLevel} />
                        </Box>
                        <Box className="min-w-[160px] flex-1 sm:max-w-[208px]">
                            <FilterSelect options={roleplayDiscFilterOptions} value={disc} onChange={setDisc} />
                        </Box>
                        <Link
                            href="/roleplays/new"
                            className="ml-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Créer un scénario
                        </Link>
                    </Box>
                </CardSurface>

                {filteredRoleplays.length > 0 ? (
                    <Box className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredRoleplays.map((roleplay) => {
                            const categoryStyle =
                                categoryBadgeStyles[roleplay.category] ?? { bg: "#F3E8FD", text: "#8B2FD6" };
                            const difficultyStyle = difficultyBadgeStyles[roleplay.difficulty];
                            const discStyle = discBadgeStyles[roleplay.disc];

                            return (
                                <CardSurface
                                    key={roleplay.id}
                                    className="flex flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] shadow-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(17,24,39,0.12)]"
                                >
                                    <Box className="relative h-[92px] bg-gradient-to-b from-[#6A57F5] to-[#5B49F2]">
                                        <Box
                                            className="absolute left-4 top-4 inline-flex h-5 items-center rounded-lg px-2.5 text-[12px] font-semibold"
                                            style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
                                        >
                                            {roleplay.category}
                                        </Box>
                                        <Button
                                            aria-label={`Actions pour ${roleplay.name}`}
                                            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/15"
                                        >
                                            <InlineIcon icon={MoreVertical} className="h-4 w-4" />
                                        </Button>
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

                                        <Text className="flex-1 text-center text-[14px] font-medium leading-6 text-[#4B5563]">
                                            {roleplay.description}
                                        </Text>

                                        <Link
                                            href={`/roleplays/${roleplay.id}`}
                                            className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] text-[14px] font-semibold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                        >
                                            <InlineIcon icon={Phone} className="h-4 w-4" />
                                            S&apos;entraîner
                                        </Link>
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

                <Box className="mt-10 flex justify-center">
                    <Link
                        href="/roleplays/history"
                        className="flex h-11 items-center justify-center rounded-xl border border-[#C9C2FB] bg-white px-6 text-[14px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]"
                    >
                        Historique des sessions
                    </Link>
                </Box>
            </Box>
        </Box>
    );
}
