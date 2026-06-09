"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Building2,
    Check,
    ChevronDown,
    Plus,
    Upload,
    User,
    Users,
    X,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { CreateCoachPageContent } from "@/features/coaches/components/CreateCoachPageContent";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { CreatePersonaPageContent } from "@/features/personas/components/CreatePersonaPageContent";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { skills } from "@/features/skills/data/skills";
import {
    roleplayCategoryOptions,
    roleplayDifficultyOptions,
    roleplayDomainOptions,
    roleplayMethodOptions,
} from "@/features/roleplays/data/roleplays";
import { demoOrganizations } from "@/features/organizations/domain/organization-list";
import {
    demoOrganizationGroups,
    demoOrganizationUsers,
} from "@/features/organizations/domain/organization-detail";

type RoleplayAssignmentType = "organization" | "group" | "user";
type EntityEditor = "coach" | "persona";

interface SelectOption {
    label: string;
    value: string;
}

interface PersonasPayload {
    error?: string;
    personas?: PersonaListItem[];
}

interface CoachesPayload {
    coaches?: CoachListItem[];
    error?: string;
}

const ALL_ORGS_SENTINEL = "__all_orgs__";

const ROLEPLAY_ASSIGNMENT_TYPES: { value: RoleplayAssignmentType; label: string; icon: LucideIcon }[] = [
    { value: "organization", label: "Organisation", icon: Building2 },
    { value: "group", label: "Groupe", icon: Users },
    { value: "user", label: "Utilisateur", icon: User },
];


const skillNames = skills.map((skill) => skill.name);
const staticOptions = (options: string[]): SelectOption[] => options.map((option) => ({ label: option, value: option }));

const fieldLabelClasses = "mb-2 block text-[14px] font-bold text-[#111827]";

async function fetchPersonas() {
    const response = await fetch("/api/personas", {
        headers: { Accept: "application/json" },
    });
    const payload = (await response.json().catch(() => null)) as PersonasPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error ?? "Impossible de charger les personas IA.");
    }

    return payload?.personas ?? [];
}

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

function useOutsideClose(onClose: () => void) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);
    return ref;
}

function AssignmentTypeSelect({
    value,
    onChange,
}: {
    value: RoleplayAssignmentType | null;
    onChange: (value: RoleplayAssignmentType) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));
    const selected = ROLEPLAY_ASSIGNMENT_TYPES.find((option) => option.value === value);

    return (
        <div ref={ref} className="relative">
            <Button
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={`flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition hover:border-[#D5D7DE] ${
                    selected ? "font-medium text-[#111827]" : "text-[#9CA3AF]"
                }`}
            >
                <Box className="flex items-center gap-2">
                    {selected && <InlineIcon icon={selected.icon} className="h-4 w-4 text-[#6B7280]" />}
                    <Text as="span">{selected ? selected.label : "Sélectionner un type"}</Text>
                </Box>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && (
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 overflow-hidden rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {ROLEPLAY_ASSIGNMENT_TYPES.map((option) => {
                        const isSelected = option.value === value;
                        return (
                            <Button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB] ${
                                    isSelected ? "text-[#5140F0]" : "text-[#111827]"
                                }`}
                            >
                                <Box className="flex items-center gap-2">
                                    <InlineIcon
                                        icon={option.icon}
                                        className={`h-4 w-4 ${isSelected ? "text-[#5140F0]" : "text-[#6B7280]"}`}
                                    />
                                    <Text as="span">{option.label}</Text>
                                </Box>
                                {isSelected && (
                                    <InlineIcon icon={Check} className="h-4 w-4 shrink-0 text-[#5140F0]" />
                                )}
                            </Button>
                        );
                    })}
                </CardSurface>
            )}
        </div>
    );
}

function SingleSelect({
    options,
    value,
    placeholder,
    disabled,
    onChange,
}: {
    options: SelectOption[];
    value: string | null;
    placeholder: string;
    disabled?: boolean;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));
    const selected = options.find((option) => option.value === value);

    return (
        <div ref={ref} className="relative">
            <Button
                disabled={disabled}
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={`flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition ${
                    disabled ? "cursor-not-allowed opacity-70" : "hover:border-[#D5D7DE]"
                } ${value ? "font-medium text-[#111827]" : "text-[#9CA3AF]"}`}
            >
                <Text as="span">{selected?.label ?? placeholder}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && !disabled && (
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {options.map((option) => (
                        <Button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB] ${
                                option.value === value ? "text-[#5140F0]" : "text-[#111827]"
                            }`}
                        >
                            <Text as="span">{option.label}</Text>
                            {option.value === value && (
                                <InlineIcon icon={Check} className="h-4 w-4 shrink-0 text-[#5140F0]" />
                            )}
                        </Button>
                    ))}
                </CardSurface>
            )}
        </div>
    );
}

function MultiSelect({
    options,
    selected,
    placeholder,
    onToggle,
}: {
    options: string[];
    selected: string[];
    placeholder: string;
    onToggle: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));

    return (
        <div ref={ref} className="relative">
            {selected.length > 0 && (
                <Box className="mb-2.5 flex flex-wrap gap-2">
                    {selected.map((value) => (
                        <Box
                            key={value}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#EEF0FF] pl-3 pr-2 text-[13px] font-semibold text-[#5140F0]"
                        >
                            {value}
                            <Button
                                aria-label={`Retirer ${value}`}
                                onClick={() => onToggle(value)}
                                className="flex h-5 w-5 items-center justify-center rounded-md text-[#5140F0] transition hover:bg-[#DDE0FF]"
                            >
                                <InlineIcon icon={X} className="h-3.5 w-3.5" />
                            </Button>
                        </Box>
                    ))}
                </Box>
            )}

            <Button
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] text-[#9CA3AF] transition hover:border-[#D5D7DE]"
            >
                <Text as="span">{placeholder}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && (
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[280px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                    {options.map((option) => {
                        const isChecked = selected.includes(option);
                        return (
                            <Button
                                key={option}
                                onClick={() => onToggle(option)}
                                className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-medium text-[#111827] transition hover:bg-[#F6F7FB]"
                            >
                                <Box
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition ${
                                        isChecked
                                            ? "border-[#5140F0] bg-[#5140F0] text-white"
                                            : "border-[#CDD0DA] bg-white"
                                    }`}
                                >
                                    {isChecked && <InlineIcon icon={Check} className="h-3.5 w-3.5" />}
                                </Box>
                                {option}
                            </Button>
                        );
                    })}
                </CardSurface>
            )}
        </div>
    );
}

function PlusButton({ label, onClick }: { label: string; onClick?: () => void }) {
    return (
        <Button
            aria-label={label}
            title={label}
            onClick={onClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]"
        >
            <InlineIcon icon={Plus} className="h-5 w-5" />
        </Button>
    );
}

function EntityEditorDialog({
    children,
    onClose,
    title,
}: {
    children: ReactNode;
    onClose: () => void;
    title: string;
}) {
    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, [onClose]);

    return (
        <Box
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/55 px-4 py-5 backdrop-blur-[1px]"
            onMouseDown={onClose}
        >
            <Box
                as="section"
                aria-label={title}
                aria-modal="true"
                role="dialog"
                onMouseDown={(event) => event.stopPropagation()}
                className="max-h-[calc(100vh-2.5rem)] w-full max-w-[760px] overflow-y-auto rounded-[16px] border border-[#E1E4EB] bg-white px-5 py-5 shadow-[0_24px_80px_rgba(17,24,39,0.28)] md:px-6"
            >
                <Box className="mb-5 flex items-center justify-between gap-4">
                    <Text as="h2" className="text-[20px] font-extrabold leading-tight text-[#111827]">
                        {title}
                    </Text>
                    <Button
                        aria-label="Fermer"
                        onClick={onClose}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827]"
                    >
                        <InlineIcon icon={X} className="h-5 w-5" />
                    </Button>
                </Box>
                {children}
            </Box>
        </Box>
    );
}

const textareaClasses =
    "w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10";

export function CreateRoleplayPageContent() {
    const personasQuery = useQuery({
        queryFn: fetchPersonas,
        queryKey: ["personas"],
    });
    const coachesQuery = useQuery({
        queryFn: fetchCoaches,
        queryKey: ["coaches"],
    });
    const [persona, setPersona] = useState<string | null>(null);
    const [coach, setCoach] = useState<string | null>(null);
    const [method, setMethod] = useState<string | null>(null);
    const [targetSkills, setTargetSkills] = useState<string[]>([]);
    const [domain, setDomain] = useState<string | null>(null);
    const [category, setCategory] = useState<string | null>(null);
    const [difficulty, setDifficulty] = useState<string | null>(null);
    const [context, setContext] = useState("");
    const [objective, setObjective] = useState("");
    const [obstacles, setObstacles] = useState("");
    const [assignment, setAssignment] = useState<"public" | "private">("public");
    const [assignmentType, setAssignmentType] = useState<RoleplayAssignmentType | null>(null);
    const [assignmentTargetId, setAssignmentTargetId] = useState<string | null>(null);
    const [assignmentParentOrg, setAssignmentParentOrg] = useState<string | null>(null);
    const [openEntityEditor, setOpenEntityEditor] = useState<EntityEditor | null>(null);

    const personaOptions =
        personasQuery.data?.map((item) => ({
            label: [item.name, item.role, item.company].filter(Boolean).join(" - "),
            value: item.id,
        })) ?? [];
    const coachOptions =
        coachesQuery.data?.map((item) => ({
            label: item.name,
            value: item.id,
        })) ?? [];

    function toggleSkill(value: string) {
        setTargetSkills((current) =>
            current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
        );
    }

    const canSubmit = Boolean(persona && coach && domain && category && difficulty);

    function selectCreatedPersona(createdPersona: PersonaListItem) {
        setPersona(createdPersona.id);
        setOpenEntityEditor(null);
    }

    function selectCreatedCoach(createdCoach: CoachListItem) {
        setCoach(createdCoach.id);
        setOpenEntityEditor(null);
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1000px]">
                <Box className="mb-6 flex items-start gap-4">
                    <Link
                        href="/roleplays"
                        aria-label="Retour"
                        className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Box>
                        <Text as="h1" className="text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]">
                            Créer un scénario
                        </Text>
                        <Text className="mt-1.5 text-[15px] font-semibold text-[#596273]">
                            Configurez votre scénario de roleplay personnalisé
                        </Text>
                    </Box>
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Box className="space-y-5">
                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Persona IA
                            </Text>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        disabled={personasQuery.isPending}
                                        options={personaOptions}
                                        value={persona}
                                        placeholder={personasQuery.isPending ? "Chargement des personas..." : "Sélectionner un persona IA"}
                                        onChange={setPersona}
                                    />
                                </Box>
                                <PlusButton
                                    label="Créer un nouveau persona"
                                    onClick={() => setOpenEntityEditor("persona")}
                                />
                            </Box>
                            {personasQuery.isError && (
                                <Text className="mt-2 text-[13px] font-semibold text-[#A43A3A]">
                                    {personasQuery.error.message}
                                </Text>
                            )}
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Coach IA
                            </Text>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        disabled={coachesQuery.isPending}
                                        options={coachOptions}
                                        value={coach}
                                        placeholder={coachesQuery.isPending ? "Chargement des coachs..." : "Sélectionner un coach IA"}
                                        onChange={setCoach}
                                    />
                                </Box>
                                <PlusButton
                                    label="Créer un nouveau coach IA"
                                    onClick={() => setOpenEntityEditor("coach")}
                                />
                            </Box>
                            {coachesQuery.isError && (
                                <Text className="mt-2 text-[13px] font-semibold text-[#A43A3A]">
                                    {coachesQuery.error.message}
                                </Text>
                            )}
                        </Box>
                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box className="space-y-5">
                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Méthodes et Playbooks
                            </Text>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        options={staticOptions(roleplayMethodOptions)}
                                        value={method}
                                        placeholder="Sélectionner une méthode ou un playbook"
                                        onChange={setMethod}
                                    />
                                </Box>
                                <PlusButton label="Créer une nouvelle méthode" />
                            </Box>
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Compétences ciblées (optionnel)
                            </Text>
                            <MultiSelect
                                options={skillNames}
                                selected={targetSkills}
                                placeholder="Ajouter une compétence..."
                                onToggle={toggleSkill}
                            />
                        </Box>
                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box className="space-y-5">
                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Domaines
                            </Text>
                            <SingleSelect
                                options={staticOptions(roleplayDomainOptions)}
                                value={domain}
                                placeholder="Sélectionner un domaine"
                                onChange={(value) => {
                                    setDomain(value);
                                    setCategory(null);
                                }}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Catégorie
                            </Text>
                            <SingleSelect
                                options={staticOptions(roleplayCategoryOptions)}
                                value={category}
                                placeholder={domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"}
                                disabled={!domain}
                                onChange={setCategory}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Niveau de difficulté
                            </Text>
                            <SingleSelect
                                options={staticOptions(roleplayDifficultyOptions)}
                                value={difficulty}
                                placeholder="Sélectionnez la difficulté"
                                onChange={setDifficulty}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Contexte du scénario
                            </Text>
                            <textarea
                                value={context}
                                onChange={(event) => setContext(event.target.value)}
                                placeholder="Décrivez le contexte dans lequel vous contactez ce persona..."
                                rows={3}
                                className={`min-h-[96px] ${textareaClasses}`}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Objectif(s) du scénario
                            </Text>
                            <textarea
                                value={objective}
                                onChange={(event) => setObjective(event.target.value)}
                                placeholder="Quel est votre objectif principal ?"
                                rows={3}
                                className={`min-h-[96px] ${textareaClasses}`}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Freins et objections (optionnel)
                            </Text>
                            <textarea
                                value={obstacles}
                                onChange={(event) => setObstacles(event.target.value)}
                                placeholder="Listez les freins et objections potentiels"
                                rows={3}
                                className={`min-h-[96px] ${textareaClasses}`}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Documents d&apos;accompagnement (optionnel)
                            </Text>
                            <Button className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]">
                                <InlineIcon icon={Upload} className="h-4 w-4" />
                                Ajouter un document
                            </Button>
                        </Box>
                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box>
                        <Text as="span" className="text-[16px] font-extrabold text-[#111827]">
                            Assignation
                        </Text>
                        <Box className="mt-4 space-y-3">
                            {[
                                {
                                    value: "public" as const,
                                    title: "Public (Maia Coach)",
                                    description: "Visible par tous les utilisateurs de la plateforme",
                                },
                                {
                                    value: "private" as const,
                                    title: "Privé",
                                    description:
                                        "Visible uniquement par une cible spécifique (organisation, groupe ou utilisateur)",
                                },
                            ].map((option) => {
                                const isSelected = assignment === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isSelected}
                                        onClick={() => setAssignment(option.value)}
                                        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                                            isSelected
                                                ? "border-[#5140F0] bg-[#F4F3FE]"
                                                : "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]"
                                        }`}
                                    >
                                        <Box
                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                                isSelected ? "border-[#5140F0]" : "border-[#9CA3AF]"
                                            }`}
                                        >
                                            {isSelected && <Box className="h-2.5 w-2.5 rounded-full bg-[#5140F0]" />}
                                        </Box>
                                        <Box>
                                            <Text className="text-[14px] font-bold text-[#111827]">
                                                {option.title}
                                            </Text>
                                            <Text className="mt-0.5 text-[13px] font-medium text-[#6B7280]">
                                                {option.description}
                                            </Text>
                                        </Box>
                                    </button>
                                );
                            })}
                        </Box>

                        {assignment === "private" && (
                            <Box className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#FAFAFB] p-4">
                                <Box className="space-y-4">
                                    <Box>
                                        <Text as="span" className={fieldLabelClasses}>
                                            Type d&apos;assignation
                                        </Text>
                                        <AssignmentTypeSelect
                                            value={assignmentType}
                                            onChange={(next) => {
                                                setAssignmentType(next);
                                                setAssignmentTargetId(null);
                                                setAssignmentParentOrg(null);
                                            }}
                                        />
                                    </Box>

                                    {assignmentType === "organization" && (
                                        <Box>
                                            <Text as="span" className={fieldLabelClasses}>
                                                Sélectionner une organisation
                                            </Text>
                                            <SingleSelect
                                                options={staticOptions(demoOrganizations.map((o) => o.name))}
                                                value={assignmentTargetId}
                                                placeholder="Choisir une organisation..."
                                                onChange={setAssignmentTargetId}
                                            />
                                        </Box>
                                    )}

                                    {assignmentType === "group" && (
                                        <>
                                            <Box>
                                                <Text as="span" className={fieldLabelClasses}>
                                                    Sélectionner une organisation
                                                </Text>
                                                <SingleSelect
                                                    options={staticOptions([
                                                        "Tous les groupes de toutes les organisations",
                                                        ...demoOrganizations.map((o) => o.name),
                                                    ])}
                                                    value={assignmentParentOrg}
                                                    placeholder="Choisir une organisation..."
                                                    onChange={(next) => {
                                                        setAssignmentParentOrg(next);
                                                        setAssignmentTargetId(
                                                            next ===
                                                                "Tous les groupes de toutes les organisations"
                                                                ? ALL_ORGS_SENTINEL
                                                                : null,
                                                        );
                                                    }}
                                                />
                                            </Box>
                                            {assignmentParentOrg &&
                                                assignmentParentOrg !==
                                                    "Tous les groupes de toutes les organisations" && (
                                                    <Box>
                                                        <Text as="span" className={fieldLabelClasses}>
                                                            Sélectionner un groupe
                                                        </Text>
                                                        <SingleSelect
                                                            options={staticOptions(demoOrganizationGroups.map((g) => g.name))}
                                                            value={assignmentTargetId}
                                                            placeholder="Choisir un groupe..."
                                                            onChange={setAssignmentTargetId}
                                                        />
                                                    </Box>
                                                )}
                                        </>
                                    )}

                                    {assignmentType === "user" && (
                                        <Box>
                                            <Text as="span" className={fieldLabelClasses}>
                                                Sélectionner un utilisateur
                                            </Text>
                                            <SingleSelect
                                                options={staticOptions(demoOrganizationUsers.map((u) => u.name))}
                                                value={assignmentTargetId}
                                                placeholder="Choisir un utilisateur..."
                                                onChange={setAssignmentTargetId}
                                            />
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </CardSurface>

                <Box className="mt-6 flex justify-end gap-3">
                    <Link
                        href="/roleplays"
                        className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                    >
                        Annuler
                    </Link>
                    <Button
                        disabled={!canSubmit}
                        className={`flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition ${
                            canSubmit
                                ? "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]"
                                : "cursor-not-allowed bg-[#B9B2F8]"
                        }`}
                    >
                        Créer le scénario
                    </Button>
                </Box>
            </Box>

            {openEntityEditor === "persona" && (
                <EntityEditorDialog title="Créer un persona IA" onClose={() => setOpenEntityEditor(null)}>
                    <CreatePersonaPageContent embedded onSaved={selectCreatedPersona} />
                </EntityEditorDialog>
            )}

            {openEntityEditor === "coach" && (
                <EntityEditorDialog title="Créer un coach IA" onClose={() => setOpenEntityEditor(null)}>
                    <CreateCoachPageContent embedded onSaved={selectCreatedCoach} />
                </EntityEditorDialog>
            )}
        </Box>
    );
}
