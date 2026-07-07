"use client";

import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Plus, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    skillCategoryStyles,
    skillDomainOptions,
    skillFunctionOptions,
    skillTypeOptions,
    type SkillListItem,
} from "@/features/skills/domain/skills";

interface FilterState {
    domain: string;
    type: string;
    function: string;
}

interface SkillsPageContentProps {
    canManage: boolean;
    skills: SkillListItem[];
}

const defaultFilters: FilterState = {
    domain: skillDomainOptions[0],
    type: skillTypeOptions[0],
    function: skillFunctionOptions[0],
};

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
                className="flex h-11 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[14px] font-medium text-[#111827] transition hover:border-[#D5D7DE]"
            >
                <Text as="span">{value}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && (
                <CardSurface className="absolute left-0 right-0 top-[52px] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {options.map((option) => (
                        <Button
                            key={option}
                            onClick={() => {
                                onChange(option);
                                setOpen(false);
                            }}
                            className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB] ${
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

export function SkillsPageContent({ canManage, skills }: SkillsPageContentProps) {
    const [query, setQuery] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(defaultFilters);
    const [draftFilters, setDraftFilters] = useState<FilterState>(defaultFilters);

    const filteredSkills = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return skills.filter((skill) => {
            const matchesQuery =
                !normalized ||
                [skill.name, skill.description, skill.domain]
                    .some((value) => value.toLowerCase().includes(normalized));
            const matchesDomain =
                appliedFilters.domain === skillDomainOptions[0] || skill.domain === appliedFilters.domain;
            const matchesType =
                appliedFilters.type === skillTypeOptions[0] || skill.category === appliedFilters.type;
            const matchesFunction =
                appliedFilters.function === skillFunctionOptions[0] ||
                skill.functions.includes(appliedFilters.function);
            return matchesQuery && matchesDomain && matchesType && matchesFunction;
        });
    }, [query, appliedFilters, skills]);

    const activeFilterCount = useMemo(
        () =>
            (Object.keys(defaultFilters) as (keyof FilterState)[]).filter(
                (key) => appliedFilters[key] !== defaultFilters[key],
            ).length,
        [appliedFilters],
    );

    function openFilters() {
        setDraftFilters(appliedFilters);
        setFiltersOpen(true);
    }

    function applyFilters() {
        setAppliedFilters(draftFilters);
        setFiltersOpen(false);
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <Box className="flex items-start gap-6">
                        <Link
                            href="/"
                            aria-label="Retour"
                            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </Link>
                        <Box>
                            <Text as="h1" className="text-[30px] font-extrabold leading-tight text-[#111827] md:text-[34px]">
                                Compétences
                            </Text>
                            <Text className="mt-2 max-w-[560px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Découvrez les compétences essentielles pour exceller dans votre métier
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <Link
                            href="/skills/new"
                            className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Ajouter une compétence
                        </Link>
                    )}
                </Box>

                <Box className="mb-6 flex items-center gap-3">
                    <Box className="relative flex-1">
                        <InlineIcon
                            icon={Search}
                            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9CA3AF]"
                        />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Rechercher..."
                            aria-label="Rechercher une compétence"
                            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-4 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10"
                        />
                    </Box>
                    <Button
                        onClick={openFilters}
                        className="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                    >
                        <InlineIcon icon={SlidersHorizontal} className="h-4 w-4 text-[#6B7280]" />
                        Filtres
                        {activeFilterCount > 0 && (
                            <Text
                                as="span"
                                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5140F0] px-1 text-[11px] font-bold text-white"
                            >
                                {activeFilterCount}
                            </Text>
                        )}
                    </Button>
                </Box>

                {filteredSkills.length > 0 ? (
                    <Box className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredSkills.map((skill) => {
                            const style = skillCategoryStyles[skill.category];
                            return (
                                <Link
                                    key={skill.id}
                                    href={`/skills/${skill.id}`}
                                    className="relative flex min-h-[132px] flex-col rounded-[14px] border border-[#E5E7EB] bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                                >
                                    <Box className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                                    <Text as="h3" className="max-w-[85%] text-[17px] font-bold leading-6 text-[#111827]">
                                        {skill.name}
                                    </Text>
                                    <Box
                                        className="mt-3 inline-flex h-[22px] w-fit items-center rounded-lg border px-2 text-[12px] font-medium"
                                        style={{
                                            backgroundColor: style.bg,
                                            borderColor: style.border,
                                            color: style.text,
                                        }}
                                    >
                                        {skill.category}
                                    </Box>
                                </Link>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={Star} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">Aucune compétence trouvée</Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            Essayez un autre terme de recherche ou ajustez les filtres.
                        </Text>
                    </CardSurface>
                )}
            </Box>

            {filtersOpen && (
                <Box className="fixed inset-0 z-40">
                    <button
                        type="button"
                        aria-label="Fermer les filtres"
                        onClick={() => setFiltersOpen(false)}
                        className="absolute inset-0 bg-[#111827]/30"
                    />
                    <CardSurface className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col rounded-l-[20px] shadow-[-24px_0_60px_rgba(17,24,39,0.18)]">
                        <Box className="flex items-center justify-between px-7 pb-5 pt-7">
                            <Text as="h2" className="text-[20px] font-extrabold text-[#111827]">
                                Filtres
                            </Text>
                            <Button
                                aria-label="Fermer"
                                onClick={() => setFiltersOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F8]"
                            >
                                <InlineIcon icon={X} className="h-5 w-5" />
                            </Button>
                        </Box>
                        <Box className="h-px bg-[#ECEEF3]" />

                        <Box className="flex-1 space-y-6 overflow-y-auto px-7 py-6">
                            <Box>
                                <Text as="span" className="mb-2 block text-[14px] font-bold text-[#111827]">
                                    Domaine de compétence
                                </Text>
                                <FilterSelect
                                    options={skillDomainOptions}
                                    value={draftFilters.domain}
                                    onChange={(value) => setDraftFilters((current) => ({ ...current, domain: value }))}
                                />
                            </Box>
                            <Box>
                                <Text as="span" className="mb-2 block text-[14px] font-bold text-[#111827]">
                                    Type de compétence
                                </Text>
                                <FilterSelect
                                    options={skillTypeOptions}
                                    value={draftFilters.type}
                                    onChange={(value) => setDraftFilters((current) => ({ ...current, type: value }))}
                                />
                            </Box>
                            <Box>
                                <Text as="span" className="mb-2 block text-[14px] font-bold text-[#111827]">
                                    Fonction
                                </Text>
                                <FilterSelect
                                    options={skillFunctionOptions}
                                    value={draftFilters.function}
                                    onChange={(value) =>
                                        setDraftFilters((current) => ({ ...current, function: value }))
                                    }
                                />
                            </Box>
                        </Box>

                        <Box className="border-t border-[#ECEEF3] px-7 py-5">
                            <Box className="flex items-center gap-3">
                                <Button
                                    onClick={() => setDraftFilters(defaultFilters)}
                                    className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                                >
                                    Réinitialiser
                                </Button>
                                <Button
                                    onClick={applyFilters}
                                    className="h-11 flex-1 rounded-xl bg-[#5140F0] text-[14px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7]"
                                >
                                    Appliquer
                                </Button>
                            </Box>
                        </Box>
                    </CardSurface>
                </Box>
            )}
        </Box>
    );
}
