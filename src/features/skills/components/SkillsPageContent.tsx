"use client";

import { ArrowLeft, Plus, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ContextualBackLink,
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParams } from "@/features/app-shell/domain";
import {
    CONTENT_DOMAINS,
    getCategoriesForDomain,
    isContentCategoryForDomain,
    isContentDomain,
} from "@/features/content/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { FilterSelect, type FilterSelectOption } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    SKILL_TYPES,
    isSkillType,
    skillTypeOptions,
    type SkillListItem,
} from "@/features/skills/domain/skills";
import { SKILL_TYPE_TONES } from "./skill-ui";

interface FilterState {
    category: string;
    domain: string;
    type: string;
}

interface SkillsPageContentProps {
    canManage: boolean;
    skills: SkillListItem[];
}

const allDomainsOption = { label: "Tous les domaines", value: "" } as const;
const allCategoriesOption = { label: "Toutes les catégories", value: "" } as const;
const allTypesOption = { label: skillTypeOptions[0], value: "" } as const;

const domainFilterOptions: FilterSelectOption[] = [allDomainsOption, ...CONTENT_DOMAINS];
const typeFilterOptions: FilterSelectOption[] = [allTypesOption, ...SKILL_TYPES];
const defaultFilters: FilterState = { category: "", domain: "", type: "" };

function categoryFilterOptions(domain: string): FilterSelectOption[] {
    return [allCategoriesOption, ...getCategoriesForDomain(domain)];
}

export function SkillsPageContent({ canManage, skills }: SkillsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const initialDomain = isContentDomain(searchParams.get("domain"))
        ? searchParams.get("domain")!
        : defaultFilters.domain;
    const initialFilters: FilterState = {
        category: isContentCategoryForDomain(initialDomain, searchParams.get("category"))
            ? searchParams.get("category")!
            : defaultFilters.category,
        domain: initialDomain,
        type: isSkillType(searchParams.get("type"))
            ? searchParams.get("type")!
            : defaultFilters.type,
    };
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
    const [draftFilters, setDraftFilters] = useState<FilterState>(initialFilters);

    const filteredSkills = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return skills.filter((skill) => {
            const matchesQuery =
                !normalized ||
                [skill.name, skill.description, skill.type, skill.domain ?? "", skill.category ?? ""]
                    .some((value) => value.toLowerCase().includes(normalized));
            const matchesDomain =
                !appliedFilters.domain || skill.domain === appliedFilters.domain;
            const matchesCategory =
                !appliedFilters.category || skill.category === appliedFilters.category;
            const matchesType =
                !appliedFilters.type || skill.type === appliedFilters.type;
            return matchesQuery && matchesDomain && matchesCategory && matchesType;
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
        router.replace(
            withSearchParams(currentHref, {
                category: draftFilters.category || null,
                domain: draftFilters.domain || null,
                type: draftFilters.type || null,
            }),
            { scroll: false },
        );
    }

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(withSearchParams(currentHref, { q: value.trim() || null }), { scroll: false });
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <Box className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
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
                                Compétences
                            </Text>
                            <Text className="mt-2 max-w-[560px] text-[15px] font-semibold leading-6 text-[#596273]">
                                Découvrez les compétences essentielles pour exceller dans votre métier
                            </Text>
                        </Box>
                    </Box>

                    {canManage && (
                        <ContextualLink
                            href="/skills/new"
                            className="mt-1 flex h-9 items-center justify-center gap-2.5 rounded-lg bg-[#5140F0] px-4 text-[13px] font-bold text-white shadow-[0_10px_20px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] md:mt-2"
                        >
                            <InlineIcon icon={Plus} className="h-4 w-4" />
                            Ajouter une compétence
                        </ContextualLink>
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
                            onChange={(event) => updateQuery(event.target.value)}
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
                            const typeTone = SKILL_TYPE_TONES[skill.type];
                            return (
                                <ContextualLink
                                    key={skill.id}
                                    href={`/skills/${skill.id}`}
                                    className="relative flex min-h-[132px] flex-col rounded-[14px] border border-[#E5E7EB] bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]"
                                >
                                    <Box className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
                                    <Text as="h3" className="max-w-[85%] text-[17px] font-bold leading-6 text-[#111827]">
                                        {skill.name}
                                    </Text>
                                    <Box className="mt-3 flex flex-wrap gap-2">
                                        <Box className={cn("inline-flex min-h-6 w-fit items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold", typeTone.soft)}>
                                            Type · {skill.type}
                                        </Box>
                                        {skill.domain && (
                                            <Box className={cn("inline-flex min-h-6 w-fit items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold", uiTokens.tone.info.soft)}>
                                                Domaine · {skill.domain}
                                            </Box>
                                        )}
                                        {skill.category && (
                                            <Box className={cn("inline-flex min-h-6 w-fit items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold", uiTokens.tone.primary.soft)}>
                                                Catégorie · {skill.category}
                                            </Box>
                                        )}
                                    </Box>
                                </ContextualLink>
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
                                    ariaLabel="Filtrer par domaine"
                                    options={domainFilterOptions}
                                    value={draftFilters.domain}
                                    onChange={(value) =>
                                        setDraftFilters((current) => ({
                                            ...current,
                                            category: "",
                                            domain: isContentDomain(value) ? value : "",
                                        }))
                                    }
                                />
                            </Box>
                            <Box>
                                <Text as="span" className="mb-2 block text-[14px] font-bold text-[#111827]">
                                    Type de compétence
                                </Text>
                                <FilterSelect
                                    ariaLabel="Filtrer par type"
                                    options={typeFilterOptions}
                                    value={draftFilters.type}
                                    onChange={(value) =>
                                        setDraftFilters((current) => ({
                                            ...current,
                                            type: isSkillType(value) ? value : "",
                                        }))
                                    }
                                />
                            </Box>
                            <Box>
                                <Text as="span" className="mb-2 block text-[14px] font-bold text-[#111827]">
                                    Catégorie de compétence
                                </Text>
                                <FilterSelect
                                    ariaLabel="Filtrer par catégorie"
                                    options={categoryFilterOptions(draftFilters.domain)}
                                    value={draftFilters.category}
                                    onChange={(value) =>
                                        setDraftFilters((current) => ({
                                            ...current,
                                            category: isContentCategoryForDomain(current.domain, value)
                                                ? value
                                                : "",
                                        }))
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
