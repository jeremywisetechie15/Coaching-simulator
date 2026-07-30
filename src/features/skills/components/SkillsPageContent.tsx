"use client";

import {
    Plus,
    Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParams } from "@/features/app-shell/domain";
import { ArchiveContentConfirmationModal } from "@/features/content/components";
import { requestContentCardAction } from "@/features/content/data/content-card-action.request";
import {
    CONTENT_DOMAINS,
    isContentDomain,
} from "@/features/content/domain";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    AnimatedEntityHeader,
    FilterSelect,
    LibraryFilterBar,
    LibrarySearchField,
    type FilterSelectOption,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    SKILL_TYPES,
    SKILL_ROUTES,
    isSkillType,
    skillTypeOptions,
    type SkillListItem,
} from "@/features/skills/domain/skills";
import { SKILL_TYPE_TONES } from "./skill-ui";
import { SkillCardActions } from "./SkillCardActions";

interface SkillsPageContentProps {
    canManage: boolean;
    skills: SkillListItem[];
}

const allDomainsOption = { label: "Tous les domaines", value: "" } as const;
const allTypesOption = { label: skillTypeOptions[0], value: "" } as const;

const domainFilterOptions: FilterSelectOption[] = [allDomainsOption, ...CONTENT_DOMAINS];
const typeFilterOptions: FilterSelectOption[] = [allTypesOption, ...SKILL_TYPES];

export function SkillsPageContent({ canManage, skills }: SkillsPageContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const initialDomain = isContentDomain(searchParams.get("domain"))
        ? searchParams.get("domain")!
        : "";
    const initialType = isSkillType(searchParams.get("type"))
        ? searchParams.get("type")!
        : "";
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [domain, setDomain] = useState(initialDomain);
    const [type, setType] = useState(initialType);
    const [actionError, setActionError] = useState<string | null>(null);
    const [busySkillId, setBusySkillId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [skillToArchive, setSkillToArchive] = useState<SkillListItem | null>(null);

    const filteredSkills = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return skills.filter((skill) => {
            const matchesQuery =
                !normalized ||
                [skill.name, skill.description, skill.type, skill.domain ?? "", skill.category ?? ""]
                    .some((value) => value.toLowerCase().includes(normalized));
            const matchesDomain =
                !domain || skill.domain === domain;
            const matchesType =
                !type || skill.type === type;
            return matchesQuery && matchesDomain && matchesType;
        });
    }, [domain, query, skills, type]);

    function updateQuery(value: string) {
        setQuery(value);
        router.replace(withSearchParams(currentHref, { q: value.trim() || null }), { scroll: false });
    }

    function updateDomain(value: string) {
        const nextDomain = isContentDomain(value) ? value : "";

        setDomain(nextDomain);
        router.replace(
            withSearchParams(currentHref, {
                category: null,
                domain: nextDomain || null,
            }),
            { scroll: false },
        );
    }

    function updateType(value: string) {
        const nextType = isSkillType(value) ? value : "";

        setType(nextType);
        router.replace(
            withSearchParams(currentHref, { type: nextType || null }),
            { scroll: false },
        );
    }

    async function handleDuplicate(skillId: string) {
        setActionError(null);
        setBusySkillId(skillId);

        try {
            await requestContentCardAction(
                SKILL_ROUTES.api.duplicate(skillId),
                "POST",
                "Impossible de dupliquer la compétence.",
            );
            setOpenMenuId(null);
            router.refresh();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible de dupliquer la compétence.");
        } finally {
            setBusySkillId(null);
        }
    }

    async function handleArchive() {
        if (!skillToArchive) return;

        setActionError(null);
        setBusySkillId(skillToArchive.id);

        try {
            await requestContentCardAction(
                SKILL_ROUTES.api.detail(skillToArchive.id),
                "DELETE",
                "Impossible d'archiver la compétence.",
            );
            setSkillToArchive(null);
            router.refresh();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Impossible d'archiver la compétence.");
        } finally {
            setBusySkillId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title="Compétences"
                    tone="skill"
                    actions={
                        canManage ? (
                            <ContextualLink
                                href={SKILL_ROUTES.app.create}
                                className={uiTokens.entityHeader.action.primary}
                            >
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Ajouter une compétence
                            </ContextualLink>
                        ) : undefined
                    }
                />

                <LibraryFilterBar>
                    <LibrarySearchField
                        ariaLabel="Rechercher une compétence"
                        onChange={updateQuery}
                        placeholder="Rechercher une compétence..."
                        value={query}
                    />
                    <Box className={uiTokens.filterBar.librarySelectDomain}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par domaine"
                            onChange={updateDomain}
                            options={domainFilterOptions}
                            value={domain}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectType}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par type"
                            onChange={updateType}
                            options={typeFilterOptions}
                            value={type}
                        />
                    </Box>
                </LibraryFilterBar>

                {actionError && !skillToArchive && (
                    <CardSurface className={cn("mb-5 rounded-xl border px-4 py-3 shadow-none", uiTokens.tone.danger.soft)}>
                        <Text className="text-[13px] font-semibold">{actionError}</Text>
                    </CardSurface>
                )}

                {filteredSkills.length > 0 ? (
                    <Box className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", uiTokens.motion.cardGridReveal)}>
                        {filteredSkills.map((skill) => {
                            const typeTone = SKILL_TYPE_TONES[skill.type];
                            return (
                                <CardSurface
                                    key={skill.id}
                                    className={cn(
                                        "relative min-h-[132px] rounded-[14px] border border-[#E5E7EB] bg-white p-0 shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)]",
                                        openMenuId === skill.id && uiTokens.action.cardMenuOpen,
                                    )}
                                >
                                    {canManage && (
                                        <SkillCardActions
                                            busy={busySkillId === skill.id}
                                            currentHref={currentHref}
                                            isMenuOpen={openMenuId === skill.id}
                                            onArchive={() => {
                                                setActionError(null);
                                                setOpenMenuId(null);
                                                setSkillToArchive(skill);
                                            }}
                                            onDuplicate={() => void handleDuplicate(skill.id)}
                                            onToggleMenu={() => setOpenMenuId(openMenuId === skill.id ? null : skill.id)}
                                            skill={skill}
                                        />
                                    )}
                                    <Box className={cn(
                                        "absolute top-6 h-2.5 w-2.5 rounded-full bg-[#22C55E]",
                                        canManage ? "right-16" : "right-5",
                                    )} />
                                    <ContextualLink
                                        href={SKILL_ROUTES.app.detail(skill.id)}
                                        aria-label={`Voir la compétence ${skill.name}`}
                                        className="flex min-h-[132px] flex-col rounded-[14px] p-6 pr-14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5140F0]/15"
                                    >
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
                                </CardSurface>
                            );
                        })}
                    </Box>
                ) : (
                    <CardSurface className="rounded-[16px] border border-[#E5E7EB] px-8 py-16 text-center shadow-none">
                        <InlineIcon icon={Star} className="mx-auto mb-5 h-12 w-12 text-[#C9CED8]" />
                        <Text className="text-[16px] font-extrabold text-[#111827]">
                            {!canManage && skills.length === 0
                                ? "Aucune compétence assignée"
                                : "Aucune compétence trouvée"}
                        </Text>
                        <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                            {!canManage && skills.length === 0
                                ? "Vos compétences apparaîtront lorsqu’elles vous seront assignées directement ou via un roleplay ou un quiz."
                                : "Essayez un autre terme de recherche ou ajustez les filtres."}
                        </Text>
                    </CardSurface>
                )}
            </Box>

            {skillToArchive && (
                <ArchiveContentConfirmationModal
                    busy={busySkillId === skillToArchive.id}
                    entityLabel="la compétence"
                    error={actionError}
                    name={skillToArchive.name}
                    onCancel={() => {
                        setActionError(null);
                        setSkillToArchive(null);
                    }}
                    onConfirm={() => void handleArchive()}
                />
            )}
        </Box>
    );
}
