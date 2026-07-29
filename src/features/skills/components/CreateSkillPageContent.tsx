"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, LockKeyhole, Plus, X } from "lucide-react";
import { useState } from "react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    CONTENT_STATUS,
    CONTENT_DOMAINS,
    CONTENT_VISIBILITY_SCOPE,
    getCategoriesForDomain,
    isContentCategoryForDomain,
    isContentDomain,
    type ContentCategory,
    type ContentDomain,
    type ContentStatus,
    type ContentTargetGroupOption,
    type ContentTargetOrganizationOption,
    type ContentTargetUserOption,
} from "@/features/content/domain";
import { ContentTargetScopeField, type ContentTargetScopeValue } from "@/features/content/components";
import type { SaveSkillInput } from "@/features/skills/dto";
import { SKILL_USAGE_EDIT_RESTRICTION_MESSAGE } from "@/features/skills/domain/skill-usage-edit-policy";
import {
    SKILL_ROUTES,
    SKILL_TYPES,
    isSkillType,
    type SkillDetail,
    type SkillEditorDetail,
    type SkillType,
} from "@/features/skills/domain/skills";
import {
    Box,
    Button,
    CardSurface,
    FieldLabel,
    InlineIcon,
    Text,
    TextArea,
    TextInput,
} from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { AlertMessage, SingleSelectField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const fieldLabelClasses = "block text-[14px] font-bold text-[#111827]";
const protectedControlClasses = "disabled:cursor-not-allowed disabled:opacity-65";

interface ApiErrorPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    skill?: SkillDetail;
}

interface CreateSkillPageContentProps {
    groupOptions: ContentTargetGroupOption[];
    initialSkill?: SkillDetail & Partial<Pick<SkillEditorDetail, "hasProtectedUsage">>;
    organizationOptions: ContentTargetOrganizationOption[];
    userOptions: ContentTargetUserOption[];
}

interface SkillDimensionFormItem {
    id?: string;
    label: string;
}

async function saveSkill(skillId: string | undefined, values: SaveSkillInput) {
    const response = await fetch(skillId ? SKILL_ROUTES.api.detail(skillId) : SKILL_ROUTES.api.collection, {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: skillId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer la compétence.",
        );
    }

    if (!payload?.skill) {
        throw new Error("La compétence a été enregistrée mais la réponse est incomplète.");
    }

    return payload.skill;
}

async function duplicateSkill(skillId: string) {
    const response = await fetch(SKILL_ROUTES.api.duplicate(skillId), {
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible de dupliquer la compétence.",
        );
    }

    if (!payload?.skill) {
        throw new Error("La compétence a été dupliquée mais la réponse est incomplète.");
    }

    return payload.skill;
}

function DimensionSection({
    disabled,
    title,
    placeholder,
    items,
    onAdd,
    onChange,
    onRemove,
}: {
    disabled: boolean;
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
                    disabled={disabled}
                    onClick={onAdd}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE] disabled:cursor-not-allowed disabled:opacity-65"
                >
                    <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                    Ajouter
                </Button>
            </Box>
            <Box className="mt-3 space-y-2.5">
                {items.map((item, index) => (
                    <Box key={item.id ?? index} className="flex items-center gap-2.5">
                        <Box className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]" />
                        <TextInput
                            disabled={disabled}
                            hasLeadingIcon={false}
                            value={item.label}
                            onChange={(event) => onChange(index, event.target.value)}
                            placeholder={placeholder}
                            className={cn("h-12", protectedControlClasses)}
                        />
                        {items.length > 1 && (
                            <Button
                                aria-label="Retirer"
                                disabled={disabled}
                                onClick={() => onRemove(index)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-65"
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
    const isDraft = !initialSkill || initialSkill.status === CONTENT_STATUS.draft;
    const hasProtectedUsage = initialSkill?.hasProtectedUsage ?? false;
    const [name, setName] = useState(initialSkill?.name ?? "");
    const [description, setDescription] = useState(initialSkill?.description ?? "");
    const [type, setType] = useState<SkillType | null>(() =>
        isSkillType(initialSkill?.type) ? initialSkill.type : null,
    );
    const [domain, setDomain] = useState<ContentDomain | null>(() =>
        isContentDomain(initialSkill?.domain) ? initialSkill.domain : null,
    );
    const [category, setCategory] = useState<ContentCategory | null>(() =>
        isContentCategoryForDomain(initialSkill?.domain, initialSkill?.category)
            ? initialSkill.category
            : null,
    );
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
    const [duplicating, setDuplicating] = useState(false);
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
            category: category ?? "",
            description,
            dimensionItems: {
                savoir: knowledge.map((item) => ({ id: item.id, label: item.label })),
                savoir_etre: attitude.map((item) => ({ id: item.id, label: item.label })),
                savoir_faire: knowHow.map((item) => ({ id: item.id, label: item.label })),
            },
            domain: domain ?? "",
            type: type ?? "Métier",
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
        if (isSaving || duplicating || !canSubmit) return;

        setFormError(null);
        setSavingStatus(status);

        try {
            await saveSkill(initialSkill?.id, buildPayload(status));
            notifyFormSubmitSuccess();
            router.push(SKILL_ROUTES.app.collection);
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer la compétence."));
        } finally {
            setSavingStatus(null);
        }
    }

    async function handleDuplicate() {
        if (!initialSkill || duplicating || isSaving) return;

        setFormError(null);
        setDuplicating(true);

        try {
            const duplicate = await duplicateSkill(initialSkill.id);
            router.push(SKILL_ROUTES.app.edit(duplicate.id));
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de dupliquer la compétence."));
        } finally {
            setDuplicating(false);
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1180px]">
                <Box className="mb-6 flex items-center gap-4">
                    <ContextualBackLink
                        fallbackHref={SKILL_ROUTES.app.collection}
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

                {hasProtectedUsage && (
                    <Box
                        className={cn(
                            "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                            uiTokens.surface.mutedPanel,
                        )}
                    >
                        <Box className="flex min-w-0 items-start gap-3">
                            <InlineIcon
                                icon={LockKeyhole}
                                className={cn("mt-0.5 h-4 w-4 shrink-0", uiTokens.text.primary)}
                            />
                            <Text className={cn("text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                                {SKILL_USAGE_EDIT_RESTRICTION_MESSAGE}
                            </Text>
                        </Box>
                        <Button
                            disabled={duplicating || isSaving}
                            onClick={() => void handleDuplicate()}
                            className={cn(
                                uiTokens.action.accentSecondaryButton,
                                "shrink-0 disabled:cursor-not-allowed disabled:opacity-60",
                            )}
                        >
                            <InlineIcon icon={Copy} className="h-4 w-4" />
                            {duplicating ? "Duplication..." : "Dupliquer pour tout modifier"}
                        </Button>
                    </Box>
                )}

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    <Text as="h2" className="text-[22px] font-extrabold text-[#111827]">
                        Informations générales
                    </Text>

                    <Box className="mt-6 space-y-5">
                        <Box>
                            <FieldLabel required className={`${fieldLabelClasses} mb-2`}>
                                Nom de la compétence
                            </FieldLabel>
                            <TextInput
                                disabled={hasProtectedUsage}
                                hasLeadingIcon={false}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Ex: Accès au décideur"
                                className={cn("h-12", protectedControlClasses)}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                Description
                            </Text>
                            <TextArea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Décrivez la compétence..."
                                rows={4}
                                className="min-h-[132px]"
                            />
                        </Box>

                        <Box className="grid gap-5 md:grid-cols-3">
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Type de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    disabled={hasProtectedUsage}
                                    options={[...SKILL_TYPES]}
                                    value={type}
                                    placeholder="Sélectionner un type"
                                    onChange={(value) => {
                                        if (isSkillType(value)) setType(value);
                                    }}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Domaine de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    disabled={hasProtectedUsage}
                                    options={[...CONTENT_DOMAINS]}
                                    value={domain}
                                    placeholder="Sélectionner un domaine"
                                    onChange={(value) => {
                                        if (!isContentDomain(value)) return;

                                        setDomain(value);
                                        setCategory(null);
                                    }}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Catégorie de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    options={[...getCategoriesForDomain(domain)]}
                                    value={category}
                                    placeholder={domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"}
                                    disabled={hasProtectedUsage || !domain}
                                    onChange={(value) => {
                                        if (isContentCategoryForDomain(domain, value)) {
                                            setCategory(value);
                                        }
                                    }}
                                />
                            </Box>
                        </Box>

                        <ContentTargetScopeField
                            disabled={hasProtectedUsage}
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
                            disabled={hasProtectedUsage}
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
                            disabled={hasProtectedUsage}
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
                            disabled={hasProtectedUsage}
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
                        {isDraft && (
                            <Button
                                disabled={!canSubmit || isSaving || duplicating}
                                onClick={() => void handleSave(CONTENT_STATUS.draft)}
                                className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                            >
                                {savingStatus === CONTENT_STATUS.draft
                                    ? "Enregistrement..."
                                    : "Enregistrer en brouillon"}
                            </Button>
                        )}
                        <Button
                            disabled={!canSubmit || isSaving || duplicating}
                            onClick={() => void handleSave(CONTENT_STATUS.published)}
                            className={`flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition ${
                                canSubmit && !isSaving && !duplicating
                                    ? "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]"
                                    : "cursor-not-allowed bg-[#B9B2F8]"
                            }`}
                        >
                            {savingStatus === CONTENT_STATUS.published
                                ? "Enregistrement..."
                                : isDraft
                                    ? "Publier la compétence"
                                    : "Mettre à jour"}
                        </Button>
                    </Box>
                </CardSurface>
            </Box>
        </Box>
    );
}
