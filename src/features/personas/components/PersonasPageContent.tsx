"use client";

import { Copy, Edit3, MoreHorizontal, Plus, UserRoundCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    ContextualLink,
    useCurrentAppHref,
} from "@/features/app-shell/components";
import { withSearchParams } from "@/features/app-shell/domain";
import {
    ContentRemovalConfirmationModal,
    ContentRemovalMenuButton,
    ContentStatusBadge,
    EntityDetailsModalFeedback,
} from "@/features/content/components";
import { requestContentCardAction } from "@/features/content/data/content-card-action.request";
import {
    ACTIVITY_SECTORS,
    getContentRemovalErrorMessage,
    isActivitySectorCode,
    type ActivitySectorCode,
    type ContentRemovalTarget,
} from "@/features/content/domain";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    AnimatedEntityHeader,
    CardActionMenu,
    CardActionMenuButton,
    CardActionMenuLink,
    FilterSelect,
    LibraryFilterBar,
    LibrarySearchField,
    type FilterSelectOption,
} from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import type { PersonaDetail, PersonaListItem } from "@/features/personas/domain/persona-list";
import { getPersonaInitials } from "@/features/personas/domain/persona-list";
import {
    PERSONA_PCS_GROUPS,
    PERSONA_SEXES,
    isPersonaPcsGroupCode,
    isPersonaSexCode,
    type PersonaPcsGroupCode,
    type PersonaSexCode,
} from "@/features/personas/domain/persona-demographics";
import {
    PERSONA_AGE_RANGES,
    PERSONA_COMPANY_SIZES,
    filterPersonasByLibraryFilters,
    isPersonaAgeRange,
    isPersonaCompanySize,
    type PersonaAgeRange,
    type PersonaCompanySize,
} from "@/features/personas/domain/persona-library-filters";
import {
    PERSONA_DISC_PROFILES,
    isPersonaDiscProfile,
    type PersonaDiscProfile,
} from "@/features/personas/domain/persona-profile";
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

const sexFilterOptions: FilterSelectOption[] = [
    { label: "Tous les sexes", value: "" },
    ...PERSONA_SEXES.map(({ code, label }) => ({ label, value: code })),
];
const ageFilterOptions: FilterSelectOption[] = [
    { label: "Tous les âges", value: "" },
    ...PERSONA_AGE_RANGES.map(({ label, value }) => ({ label, value })),
];
const pcsFilterOptions: FilterSelectOption[] = [
    { label: "Toutes les CSP", value: "" },
    ...PERSONA_PCS_GROUPS.map(({ code, label }) => ({ label, value: code })),
];
const sectorFilterOptions: FilterSelectOption[] = [
    { label: "Tous les secteurs", value: "" },
    ...ACTIVITY_SECTORS.map(({ code, label }) => ({ label, value: code })),
];
const companySizeFilterOptions: FilterSelectOption[] = [
    { label: "Toutes les tailles", value: "" },
    ...PERSONA_COMPANY_SIZES.map(({ label, value }) => ({ label, value })),
];
const discFilterOptions: FilterSelectOption[] = [
    { label: "Tous les profils DISC", value: "" },
    ...PERSONA_DISC_PROFILES.map((profile) => ({ label: profile, value: profile })),
];

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
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentHref = useCurrentAppHref();
    const initialSex = searchParams.get("sex");
    const initialAge = searchParams.get("age");
    const initialPcs = searchParams.get("csp");
    const initialSector = searchParams.get("sector");
    const initialCompanySize = searchParams.get("companySize");
    const initialDisc = searchParams.get("disc");
    const [query, setQuery] = useState(searchParams.get("q") ?? "");
    const [sexCode, setSexCode] = useState<PersonaSexCode | "">(
        isPersonaSexCode(initialSex) ? initialSex : "",
    );
    const [ageRange, setAgeRange] = useState<PersonaAgeRange | "">(
        isPersonaAgeRange(initialAge) ? initialAge : "",
    );
    const [pcsGroupCode, setPcsGroupCode] = useState<PersonaPcsGroupCode | "">(
        isPersonaPcsGroupCode(initialPcs) ? initialPcs : "",
    );
    const [activitySectorCode, setActivitySectorCode] = useState<ActivitySectorCode | "">(
        isActivitySectorCode(initialSector) ? initialSector : "",
    );
    const [companySize, setCompanySize] = useState<PersonaCompanySize | "">(
        isPersonaCompanySize(initialCompanySize) ? initialCompanySize : "",
    );
    const [discProfile, setDiscProfile] = useState<PersonaDiscProfile | "">(
        isPersonaDiscProfile(initialDisc) ? initialDisc : "",
    );
    const [actionError, setActionError] = useState<string | null>(null);
    const [busyPersonaId, setBusyPersonaId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [personaToRemove, setPersonaToRemove] = useState<ContentRemovalTarget | null>(null);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const personasQuery = useQuery({
        initialData: initialPersonas,
        queryFn: fetchPersonas,
        queryKey: personasQueryKey,
    });
    const personas = personasQuery.data;
    const filteredPersonas = useMemo(
        () => filterPersonasByLibraryFilters(personas, {
            activitySectorCode,
            ageRange,
            companySize,
            discProfile,
            pcsGroupCode,
            query,
            sexCode,
        }),
        [activitySectorCode, ageRange, companySize, discProfile, pcsGroupCode, personas, query, sexCode],
    );
    const personaDetailQuery = useQuery({
        enabled: Boolean(selectedPersonaId),
        queryFn: () => fetchPersonaDetail(selectedPersonaId as string),
        queryKey: ["personas", "detail", selectedPersonaId],
    });

    function openPersonaDetails(personaId: string) {
        setOpenMenuId(null);
        setSelectedPersonaId(personaId);
    }

    function replaceFilterParam(param: string, value: string) {
        router.replace(withSearchParams(currentHref, { [param]: value || null }), { scroll: false });
    }

    function updateQuery(value: string) {
        setQuery(value);
        replaceFilterParam("q", value.trim());
    }

    function updateSex(value: string) {
        const nextValue = isPersonaSexCode(value) ? value : "";
        setSexCode(nextValue);
        replaceFilterParam("sex", nextValue);
    }

    function updateAge(value: string) {
        const nextValue = isPersonaAgeRange(value) ? value : "";
        setAgeRange(nextValue);
        replaceFilterParam("age", nextValue);
    }

    function updatePcs(value: string) {
        const nextValue = isPersonaPcsGroupCode(value) ? value : "";
        setPcsGroupCode(nextValue);
        replaceFilterParam("csp", nextValue);
    }

    function updateSector(value: string) {
        const nextValue = isActivitySectorCode(value) ? value : "";
        setActivitySectorCode(nextValue);
        replaceFilterParam("sector", nextValue);
    }

    function updateCompanySize(value: string) {
        const nextValue = isPersonaCompanySize(value) ? value : "";
        setCompanySize(nextValue);
        replaceFilterParam("companySize", nextValue);
    }

    function updateDisc(value: string) {
        const nextValue = isPersonaDiscProfile(value) ? value : "";
        setDiscProfile(nextValue);
        replaceFilterParam("disc", nextValue);
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

    async function handleRemove() {
        if (!personaToRemove) return;

        setActionError(null);
        setBusyPersonaId(personaToRemove.id);
        const errorMessage = getContentRemovalErrorMessage(personaToRemove.status, "le persona");

        try {
            await requestContentCardAction(
                PERSONA_ROUTES.api.detail(personaToRemove.id),
                "DELETE",
                errorMessage,
            );
            setPersonaToRemove(null);
            setSelectedPersonaId((currentId) => currentId === personaToRemove.id ? null : currentId);
            await personasQuery.refetch();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : errorMessage);
        } finally {
            setBusyPersonaId(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <AnimatedEntityHeader
                    className="mb-7"
                    title="Mes Personas IA"
                    tone="persona"
                    actions={
                        canManage ? (
                            <ContextualLink
                                href={PERSONA_ROUTES.app.create}
                                className={uiTokens.entityHeader.action.primary}
                            >
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Créer un persona IA
                            </ContextualLink>
                        ) : undefined
                    }
                />

                <LibraryFilterBar>
                    <LibrarySearchField
                        ariaLabel="Rechercher un persona"
                        onChange={updateQuery}
                        placeholder="Rechercher un persona..."
                        value={query}
                    />
                    <Box className={uiTokens.filterBar.librarySelectSex}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par sexe"
                            onChange={updateSex}
                            options={sexFilterOptions}
                            value={sexCode}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectAge}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par tranche d’âge"
                            onChange={updateAge}
                            options={ageFilterOptions}
                            value={ageRange}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectPcs}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par CSP INSEE"
                            onChange={updatePcs}
                            options={pcsFilterOptions}
                            value={pcsGroupCode}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectSector}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par secteur d’activité"
                            onChange={updateSector}
                            options={sectorFilterOptions}
                            value={activitySectorCode}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectCompanySize}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par taille d’entreprise"
                            onChange={updateCompanySize}
                            options={companySizeFilterOptions}
                            value={companySize}
                        />
                    </Box>
                    <Box className={uiTokens.filterBar.librarySelectDisc}>
                        <FilterSelect
                            appearance="library"
                            ariaLabel="Filtrer par profil DISC"
                            onChange={updateDisc}
                            options={discFilterOptions}
                            value={discProfile}
                        />
                    </Box>
                </LibraryFilterBar>

                {personasQuery.isError && (
                    <Box className="mb-5 rounded-lg border border-[#F3C7C7] bg-[#FFF4F4] px-4 py-3 text-[13px] font-semibold text-[#A43A3A]">
                        {personasQuery.error.message}
                    </Box>
                )}

                {actionError && !personaToRemove && (
                    <CardSurface className={cn("mb-5 rounded-xl border px-4 py-3 shadow-none", uiTokens.tone.danger.soft)}>
                        <Text className="text-[13px] font-semibold">{actionError}</Text>
                    </CardSurface>
                )}

                {filteredPersonas.length > 0 ? (
                    <Box className={cn("grid gap-5 md:grid-cols-2 xl:grid-cols-3", uiTokens.motion.cardGridReveal)}>
                        {filteredPersonas.map((persona) => {
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
                                        <ContentStatusBadge
                                            className="absolute left-4 top-4 z-10"
                                            status={persona.status}
                                        />
                                    )}
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
                                                    <ContentRemovalMenuButton
                                                        busy={busyPersonaId === persona.id}
                                                        status={persona.status}
                                                        onClick={() => {
                                                            setActionError(null);
                                                            setOpenMenuId(null);
                                                            setPersonaToRemove(persona);
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
                            {personas.length > 0
                                ? "Aucun persona ne correspond aux filtres sélectionnés."
                                : "Créez votre premier persona pour alimenter vos scénarios."}
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
                        canManage={canManage}
                        persona={personaDetailQuery.data}
                        onClose={() => setSelectedPersonaId(null)}
                        onRemove={() => {
                            setActionError(null);
                            setSelectedPersonaId(null);
                            setPersonaToRemove(personaDetailQuery.data);
                        }}
                    />
                )}
                {personaToRemove && (
                    <ContentRemovalConfirmationModal
                        busy={busyPersonaId === personaToRemove.id}
                        entityLabel="le persona"
                        error={actionError}
                        name={personaToRemove.name}
                        onCancel={() => {
                            setActionError(null);
                            setPersonaToRemove(null);
                        }}
                        onConfirm={() => void handleRemove()}
                        status={personaToRemove.status}
                    />
                )}
            </Box>
        </Box>
    );
}
