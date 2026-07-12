"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
    type ContentStatus,
    type ContentTargetGroupOption,
    type ContentTargetOrganizationOption,
    type ContentTargetUserOption,
} from "@/features/content/domain";
import { ContentTargetScopeField, type ContentTargetScopeValue } from "@/features/content/components";
import type { SaveSkillInput } from "@/features/skills/dto";
import type { SkillCategory, SkillDetail } from "@/features/skills/domain/skills";
import { Box, Button, CardSurface, FieldLabel, InlineIcon, Text } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import {
    skillDomainOptions,
    skillFunctionOptions,
    skillTypeOptions,
} from "@/features/skills/domain/skills";

const functionChoices = skillFunctionOptions.slice(1);
const typeChoices = skillTypeOptions.slice(1);
const domainChoices = skillDomainOptions.slice(1);

const fieldLabelClasses = "block text-[14px] font-bold text-[#111827]";
const inputClasses =
    "h-12 w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10";

interface ApiErrorPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    skill?: SkillDetail;
}

interface CreateSkillPageContentProps {
    groupOptions: ContentTargetGroupOption[];
    initialSkill?: SkillDetail;
    organizationOptions: ContentTargetOrganizationOption[];
    userOptions: ContentTargetUserOption[];
}

interface SkillDimensionFormItem {
    id?: string;
    label: string;
}

async function saveSkill(skillId: string | undefined, values: SaveSkillInput) {
    const response = await fetch(skillId ? `/api/skills/${skillId}` : "/api/skills", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: skillId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
        throw new Error(validationMessage || payload?.error || "Impossible d'enregistrer la compétence.");
    }

    if (!payload?.skill) {
        throw new Error("La compétence a été enregistrée mais la réponse est incomplète.");
    }

    return payload.skill;
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

function SingleSelect({
    options,
    value,
    placeholder,
    onChange,
}: {
    options: string[];
    value: string | null;
    placeholder: string;
    onChange: (value: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));

    return (
        <div ref={ref} className="relative">
            <Button
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className={`flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition hover:border-[#D5D7DE] ${
                    value ? "font-medium text-[#111827]" : "text-[#9CA3AF]"
                }`}
            >
                <Text as="span">{value ?? placeholder}</Text>
                <InlineIcon
                    icon={ChevronDown}
                    className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                />
            </Button>

            {open && (
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
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
                <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[268px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
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

function DimensionSection({
    title,
    placeholder,
    items,
    onAdd,
    onChange,
    onRemove,
}: {
    title: string;
    placeholder: string;
    items: SkillDimensionFormItem[];
    onAdd: () => void;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
}) {
    return (
        <Box>
            <Box className="flex items-center justify-between">
                <Text as="span" className={fieldLabelClasses}>
                    {title}
                </Text>
                <Button
                    onClick={onAdd}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                >
                    <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                    Ajouter
                </Button>
            </Box>
            <Box className="mt-3 space-y-2.5">
                {items.map((item, index) => (
                    <Box key={item.id ?? index} className="flex items-center gap-2.5">
                        <Box className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]" />
                        <input
                            value={item.label}
                            onChange={(event) => onChange(index, event.target.value)}
                            placeholder={placeholder}
                            className={inputClasses}
                        />
                        {items.length > 1 && (
                            <Button
                                aria-label="Retirer"
                                onClick={() => onRemove(index)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]"
                            >
                                <InlineIcon icon={X} className="h-4 w-4" />
                            </Button>
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function editableDimensionItems(
    initialSkill: SkillDetail | undefined,
    dimension: "savoir" | "savoir_faire" | "savoir_etre",
): SkillDimensionFormItem[] {
    const items =
        initialSkill?.dimensionItems
            .filter((item) => item.dimension === dimension)
            .sort((first, second) => first.order - second.order)
            .map((item) => ({ id: item.id, label: item.label })) ?? [];

    return items.length > 0 ? items : [{ label: "" }];
}

function getInitialTargetScopeValue(
    initialSkill: SkillDetail | undefined,
    groupOptions: ContentTargetGroupOption[],
    userOptions: ContentTargetUserOption[],
): ContentTargetScopeValue {
    const scope = initialSkill?.scope ?? CONTENT_VISIBILITY_SCOPE.public;
    const assignedUserId = initialSkill?.assignedUserId ?? "";
    let groupId = initialSkill?.groupId ?? "";
    let organizationId = initialSkill?.organizationId ?? null;

    if (scope === CONTENT_VISIBILITY_SCOPE.user && assignedUserId) {
        const user = userOptions.find((option) => option.id === assignedUserId);

        if (user) {
            if (!groupId) groupId = user.groupIds[0] ?? "";
            if (!organizationId) organizationId = user.organizationIds[0] ?? null;
        }
    }

    if ((scope === CONTENT_VISIBILITY_SCOPE.user || scope === CONTENT_VISIBILITY_SCOPE.group) && groupId) {
        const group = groupOptions.find((option) => option.id === groupId);
        if (group) organizationId = group.organizationId;
    }

    return {
        assignedUserId,
        groupId,
        organizationId,
        scope,
    };
}

export function CreateSkillPageContent({
    groupOptions,
    initialSkill,
    organizationOptions,
    userOptions,
}: CreateSkillPageContentProps) {
    const router = useRouter();
    const isEditing = Boolean(initialSkill);
    const [name, setName] = useState(initialSkill?.name ?? "");
    const [description, setDescription] = useState(initialSkill?.description ?? "");
    const [functions, setFunctions] = useState<string[]>(initialSkill?.functions ?? []);
    const [type, setType] = useState<SkillCategory | null>(initialSkill?.category ?? null);
    const [domain, setDomain] = useState<string | null>(initialSkill?.domain || null);
    const [targetScope, setTargetScope] = useState<ContentTargetScopeValue>(() =>
        getInitialTargetScopeValue(initialSkill, groupOptions, userOptions),
    );
    const [knowledge, setKnowledge] = useState<SkillDimensionFormItem[]>(
        editableDimensionItems(initialSkill, "savoir"),
    );
    const [knowHow, setKnowHow] = useState<SkillDimensionFormItem[]>(
        editableDimensionItems(initialSkill, "savoir_faire"),
    );
    const [attitude, setAttitude] = useState<SkillDimensionFormItem[]>(
        editableDimensionItems(initialSkill, "savoir_etre"),
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [savingStatus, setSavingStatus] = useState<ContentStatus | null>(null);

    const scopeTargetReady =
        targetScope.scope === CONTENT_VISIBILITY_SCOPE.public ||
        (targetScope.scope === CONTENT_VISIBILITY_SCOPE.organization && Boolean(targetScope.organizationId)) ||
        (targetScope.scope === CONTENT_VISIBILITY_SCOPE.group &&
            Boolean(targetScope.organizationId) &&
            Boolean(targetScope.groupId.trim())) ||
        (targetScope.scope === CONTENT_VISIBILITY_SCOPE.user && Boolean(targetScope.assignedUserId.trim()));
    const canSubmit = name.trim().length > 0 && scopeTargetReady;
    const isSaving = savingStatus !== null;

    function toggleFunction(value: string) {
        setFunctions((current) =>
            current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
        );
    }

    function updateList(
        list: SkillDimensionFormItem[],
        setter: (next: SkillDimensionFormItem[]) => void,
        index: number,
        value: string,
    ) {
        setter(list.map((item, itemIndex) => (itemIndex === index ? { ...item, label: value } : item)));
    }

    function buildPayload(status: ContentStatus): SaveSkillInput {
        return {
            category: type ?? "Métier",
            description,
            dimensionItems: {
                savoir: knowledge.map((item) => ({ id: item.id, label: item.label })),
                savoir_etre: attitude.map((item) => ({ id: item.id, label: item.label })),
                savoir_faire: knowHow.map((item) => ({ id: item.id, label: item.label })),
            },
            domain: domain ?? "",
            functions,
            assignedUserId: targetScope.scope === CONTENT_VISIBILITY_SCOPE.user ? targetScope.assignedUserId : null,
            groupId: targetScope.scope === CONTENT_VISIBILITY_SCOPE.group ? targetScope.groupId : null,
            name,
            organizationId:
                targetScope.scope === CONTENT_VISIBILITY_SCOPE.organization ||
                targetScope.scope === CONTENT_VISIBILITY_SCOPE.group
                    ? targetScope.organizationId
                    : null,
            scope: targetScope.scope,
            status,
        };
    }

    async function handleSave(status: ContentStatus) {
        if (isSaving || !canSubmit) return;

        setFormError(null);
        setSavingStatus(status);

        try {
            await saveSkill(initialSkill?.id, buildPayload(status));
            router.push("/skills");
            router.refresh();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Impossible d'enregistrer la compétence.");
        } finally {
            setSavingStatus(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-6 flex items-center gap-4">
                    <ContextualBackLink
                        fallbackHref="/skills"
                        aria-label="Retour"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Text as="h1" className="text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]">
                        {isEditing ? "Modifier la compétence" : "Ajouter une compétence"}
                    </Text>
                </Box>

                {formError && <Box className="mb-5"><AlertMessage message={formError} /></Box>}

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Text as="h2" className="text-[22px] font-extrabold text-[#111827]">
                        Informations générales
                    </Text>

                    <Box className="mt-6 space-y-5">
                        <Box>
                            <FieldLabel required className={`${fieldLabelClasses} mb-2`}>
                                Nom de la compétence
                            </FieldLabel>
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Ex: Accès au décideur"
                                className={inputClasses}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                Description
                            </Text>
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Décrivez la compétence..."
                                rows={4}
                                className="min-h-[132px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 py-3 text-[14px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10"
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                Fonctions
                            </Text>
                            <MultiSelect
                                options={functionChoices}
                                selected={functions}
                                placeholder="Sélectionner les fonctions"
                                onToggle={toggleFunction}
                            />
                        </Box>

                        <Box className="grid gap-5 md:grid-cols-2">
                            <Box>
                                <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                    Type de compétence
                                </Text>
                                <SingleSelect
                                    options={typeChoices}
                                    value={type}
                                    placeholder="Sélectionner un type"
                                    onChange={(value) => setType(value as SkillCategory)}
                                />
                            </Box>
                            <Box>
                                <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                    Domaine de compétence
                                </Text>
                                <SingleSelect
                                    options={domainChoices}
                                    value={domain}
                                    placeholder="Sélectionner un domaine"
                                    onChange={setDomain}
                                />
                            </Box>
                        </Box>

                        <ContentTargetScopeField
                            groupOptions={groupOptions}
                            organizationOptions={organizationOptions}
                            userOptions={userOptions}
                            value={targetScope}
                            onChange={setTargetScope}
                        />
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Text as="h2" className="text-[22px] font-extrabold text-[#111827]">
                        Dimensions de la compétence
                    </Text>

                    <Box className="mt-6 space-y-7">
                        <DimensionSection
                            title="Savoir (Connaissances théoriques)"
                            placeholder="Ex: Comprendre les différents rôles du standard..."
                            items={knowledge}
                            onAdd={() => setKnowledge((current) => [...current, { label: "" }])}
                            onChange={(index, value) => updateList(knowledge, setKnowledge, index, value)}
                            onRemove={(index) =>
                                setKnowledge((current) => current.filter((_, itemIndex) => itemIndex !== index))
                            }
                        />
                        <DimensionSection
                            title="Savoir-faire (Compétences pratiques)"
                            placeholder="Ex: Formuler une demande de mise en relation claire..."
                            items={knowHow}
                            onAdd={() => setKnowHow((current) => [...current, { label: "" }])}
                            onChange={(index, value) => updateList(knowHow, setKnowHow, index, value)}
                            onRemove={(index) =>
                                setKnowHow((current) => current.filter((_, itemIndex) => itemIndex !== index))
                            }
                        />
                        <DimensionSection
                            title="Savoir-être (Comportements et attitudes)"
                            placeholder="Ex: Adopter un ton assuré sans agressivité..."
                            items={attitude}
                            onAdd={() => setAttitude((current) => [...current, { label: "" }])}
                            onChange={(index, value) => updateList(attitude, setAttitude, index, value)}
                            onRemove={(index) =>
                                setAttitude((current) => current.filter((_, itemIndex) => itemIndex !== index))
                            }
                        />
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Box className="flex justify-end gap-3">
                        <Button
                            disabled={!canSubmit || isSaving}
                            onClick={() => void handleSave(CONTENT_STATUS.draft)}
                            className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                        >
                            {savingStatus === CONTENT_STATUS.draft ? "Enregistrement..." : "Enregistrer en brouillon"}
                        </Button>
                        <Button
                            disabled={!canSubmit || isSaving}
                            onClick={() => void handleSave(CONTENT_STATUS.published)}
                            className={`flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition ${
                                canSubmit && !isSaving
                                    ? "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]"
                                    : "cursor-not-allowed bg-[#B9B2F8]"
                            }`}
                        >
                            {savingStatus === CONTENT_STATUS.published
                                ? "Publication..."
                                : isEditing
                                    ? "Mettre à jour"
                                    : "Publier la compétence"}
                        </Button>
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
