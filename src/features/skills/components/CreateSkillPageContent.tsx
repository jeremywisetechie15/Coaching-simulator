"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, FileUp, LockKeyhole, Plus, X } from "lucide-react";
import { useState } from "react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    EntityCreationModeDialog,
    EntityJsonPrefillDialog,
} from "@/features/entity-json-prefill/components";
import {
    ENTITY_CREATION_MODE,
    ENTITY_CREATION_MODE_LABELS,
    type EntityCreationMode,
} from "@/features/entity-json-prefill/domain";
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
    buildSkillJsonPrefillPrompt,
    parseSkillJsonPrefillText,
    SKILL_JSON_PREFILL_FIELD,
    type SkillJsonPrefillField,
    type SkillJsonPrefillFieldErrors,
} from "@/features/skills/domain/skill-json-prefill";
import {
    Box,
    Button,
    CardSurface,
    FieldErrorMessage,
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
import { AlertMessage, SingleSelectField, StatusMessage } from "@/lib/ui/molecules";
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
    error,
    errorField,
    title,
    placeholder,
    items,
    onAdd,
    onChange,
    onRemove,
    itemErrors,
}: {
    disabled: boolean;
    error?: string;
    errorField: string;
    title: string;
    placeholder: string;
    items: SkillDimensionFormItem[];
    onAdd: () => void;
    onChange: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    itemErrors?: Record<number, string>;
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
                    <Box key={item.id ?? index}>
                        <Box className="flex items-center gap-2.5">
                            <Box className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]" />
                            <TextInput
                                aria-describedby={itemErrors?.[index] ? `${errorField}-${index}-error` : undefined}
                                aria-invalid={itemErrors?.[index] ? true : undefined}
                                disabled={disabled}
                                hasLeadingIcon={false}
                                value={item.label}
                                onChange={(event) => onChange(index, event.target.value)}
                                placeholder={placeholder}
                                className={cn(
                                    "h-12",
                                    protectedControlClasses,
                                    itemErrors?.[index] && uiTokens.form.controlError,
                                )}
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
                        <Box className="ml-4">
                            <FieldErrorMessage
                                id={`${errorField}-${index}-error`}
                                message={itemErrors?.[index]}
                            />
                        </Box>
                    </Box>
                ))}
            </Box>
            <FieldErrorMessage id={`${errorField}-error`} message={error} />
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
    const [creationModeDialogOpen, setCreationModeDialogOpen] = useState(!isEditing);
    const [jsonPrefillDialogOpen, setJsonPrefillDialogOpen] = useState(false);
    const [jsonPrefillFieldErrors, setJsonPrefillFieldErrors] =
        useState<SkillJsonPrefillFieldErrors>({});
    const [jsonPrefillMessage, setJsonPrefillMessage] = useState<string | null>(null);
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
    const canSubmit =
        name.trim().length > 0 &&
        scopeTargetReady &&
        Object.keys(jsonPrefillFieldErrors).length === 0;
    const isSaving = savingStatus !== null;

    function clearJsonPrefillErrors(...fields: SkillJsonPrefillField[]) {
        setJsonPrefillFieldErrors((current) => {
            const next = { ...current };
            let changed = false;

            for (const field of fields) {
                if (next[field]) {
                    delete next[field];
                    changed = true;
                }
            }

            return changed ? next : current;
        });
    }

    function clearJsonPrefillErrorTree(field: SkillJsonPrefillField) {
        setJsonPrefillFieldErrors((current) => {
            const next = { ...current };
            let changed = false;

            for (const key of Object.keys(next) as SkillJsonPrefillField[]) {
                if (key === field || key.startsWith(`${field}.`)) {
                    delete next[key];
                    changed = true;
                }
            }

            return changed ? next : current;
        });
    }

    function getDimensionItemErrors(field: SkillJsonPrefillField) {
        return Object.entries(jsonPrefillFieldErrors).reduce<Record<number, string>>(
            (errors, [path, message]) => {
                if (!message || !path.startsWith(`${field}.`)) return errors;

                const index = Number(path.slice(field.length + 1));
                if (Number.isInteger(index)) errors[index] = message;
                return errors;
            },
            {},
        );
    }

    function selectCreationMode(mode: EntityCreationMode) {
        setCreationModeDialogOpen(false);
        if (mode === ENTITY_CREATION_MODE.json) {
            setJsonPrefillDialogOpen(true);
        }
    }

    async function importSkillJson(file: File) {
        const result = parseSkillJsonPrefillText(await file.text(), {
            groupOptions,
            organizationOptions,
            userOptions,
        });

        setName(result.draft.name);
        setDescription(result.draft.description);
        setType(result.draft.type);
        setDomain(result.draft.domain);
        setCategory(result.draft.category);
        setTargetScope({
            assignedUserId: result.draft.assignedUserId,
            groupId: result.draft.groupId,
            organizationId: result.draft.organizationId,
            scope: result.draft.scope,
        });
        setKnowledge(result.draft.dimensionItems.savoir.map((label) => ({ label })));
        setKnowHow(result.draft.dimensionItems.savoir_faire.map((label) => ({ label })));
        setAttitude(result.draft.dimensionItems.savoir_etre.map((label) => ({ label })));
        setJsonPrefillFieldErrors(result.fieldErrors);
        setJsonPrefillMessage(
            Object.keys(result.fieldErrors).length > 0
                ? "Le fichier a été appliqué. Corrigez les champs signalés avant d’enregistrer."
                : "Le fichier JSON a correctement prérempli la compétence.",
        );
        setFormError(null);
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
                <Box className={uiTokens.jsonPrefill.formHeader}>
                    <Box className="flex items-center gap-4">
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
                    {!isEditing && (
                        <Button
                            onClick={() => setJsonPrefillDialogOpen(true)}
                            className={uiTokens.action.secondaryButton}
                        >
                            <InlineIcon icon={FileUp} className="h-4 w-4" />
                            {ENTITY_CREATION_MODE_LABELS.json}
                        </Button>
                    )}
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
                    {jsonPrefillMessage && (
                        <Box className={uiTokens.jsonPrefill.formNotice}>
                            <StatusMessage
                                tone={Object.keys(jsonPrefillFieldErrors).length > 0 ? "info" : "success"}
                                message={
                                    Object.keys(jsonPrefillFieldErrors).length > 0
                                        ? jsonPrefillMessage
                                        : "La compétence est prête à être vérifiée et enregistrée."
                                }
                            />
                        </Box>
                    )}
                    <Text as="h2" className="text-[22px] font-extrabold text-[#111827]">
                        Informations générales
                    </Text>

                    <Box className="mt-6 space-y-5">
                        <Box>
                            <FieldLabel required className={`${fieldLabelClasses} mb-2`}>
                                Nom de la compétence
                            </FieldLabel>
                            <TextInput
                                id="skill-name"
                                aria-describedby={jsonPrefillFieldErrors.name ? "skill-name-error" : undefined}
                                aria-invalid={jsonPrefillFieldErrors.name ? true : undefined}
                                disabled={hasProtectedUsage}
                                hasLeadingIcon={false}
                                value={name}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    clearJsonPrefillErrors(SKILL_JSON_PREFILL_FIELD.name);
                                }}
                                placeholder="Ex: Accès au décideur"
                                className={cn(
                                    "h-12",
                                    protectedControlClasses,
                                    jsonPrefillFieldErrors.name && uiTokens.form.controlError,
                                )}
                            />
                            <FieldErrorMessage
                                id="skill-name-error"
                                message={jsonPrefillFieldErrors.name}
                            />
                        </Box>

                        <Box>
                            <Text as="span" className={`${fieldLabelClasses} mb-2`}>
                                Description
                            </Text>
                            <TextArea
                                id="skill-description"
                                aria-describedby={jsonPrefillFieldErrors.description ? "skill-description-error" : undefined}
                                aria-invalid={jsonPrefillFieldErrors.description ? true : undefined}
                                value={description}
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    clearJsonPrefillErrors(SKILL_JSON_PREFILL_FIELD.description);
                                }}
                                placeholder="Décrivez la compétence..."
                                rows={4}
                                className={cn(
                                    "min-h-[132px]",
                                    jsonPrefillFieldErrors.description && uiTokens.form.controlError,
                                )}
                            />
                            <FieldErrorMessage
                                id="skill-description-error"
                                message={jsonPrefillFieldErrors.description}
                            />
                        </Box>

                        <Box className="grid gap-5 md:grid-cols-3">
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Type de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    ariaDescribedBy={jsonPrefillFieldErrors.type ? "skill-type-error" : undefined}
                                    disabled={hasProtectedUsage}
                                    hasError={Boolean(jsonPrefillFieldErrors.type)}
                                    options={[...SKILL_TYPES]}
                                    value={type}
                                    placeholder="Sélectionner un type"
                                    onChange={(value) => {
                                        if (isSkillType(value)) {
                                            setType(value);
                                            clearJsonPrefillErrors(SKILL_JSON_PREFILL_FIELD.type);
                                        }
                                    }}
                                />
                                <FieldErrorMessage
                                    id="skill-type-error"
                                    message={jsonPrefillFieldErrors.type}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Domaine de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    ariaDescribedBy={jsonPrefillFieldErrors.domain ? "skill-domain-error" : undefined}
                                    disabled={hasProtectedUsage}
                                    hasError={Boolean(jsonPrefillFieldErrors.domain)}
                                    options={[...CONTENT_DOMAINS]}
                                    value={domain}
                                    placeholder="Sélectionner un domaine"
                                    onChange={(value) => {
                                        if (!isContentDomain(value)) return;

                                        setDomain(value);
                                        setCategory(null);
                                        clearJsonPrefillErrors(SKILL_JSON_PREFILL_FIELD.domain);
                                    }}
                                />
                                <FieldErrorMessage
                                    id="skill-domain-error"
                                    message={jsonPrefillFieldErrors.domain}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={`${fieldLabelClasses} mb-2`}>
                                    Catégorie de compétence
                                </FieldLabel>
                                <SingleSelectField
                                    ariaDescribedBy={jsonPrefillFieldErrors.category ? "skill-category-error" : undefined}
                                    options={[...getCategoriesForDomain(domain)]}
                                    hasError={Boolean(jsonPrefillFieldErrors.category)}
                                    value={category}
                                    placeholder={domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"}
                                    disabled={hasProtectedUsage || !domain}
                                    onChange={(value) => {
                                        if (isContentCategoryForDomain(domain, value)) {
                                            setCategory(value);
                                            clearJsonPrefillErrors(SKILL_JSON_PREFILL_FIELD.category);
                                        }
                                    }}
                                />
                                <FieldErrorMessage
                                    id="skill-category-error"
                                    message={jsonPrefillFieldErrors.category}
                                />
                            </Box>
                        </Box>

                        <Box
                            className={cn(
                                jsonPrefillFieldErrors.scope && uiTokens.form.fieldErrorPanel,
                            )}
                        >
                            <ContentTargetScopeField
                                disabled={hasProtectedUsage}
                                errorIdPrefix="skill-target"
                                fieldErrors={{
                                    assignedUserId: jsonPrefillFieldErrors.assignedUserId,
                                    groupId: jsonPrefillFieldErrors.groupId,
                                    organizationId: jsonPrefillFieldErrors.organizationId,
                                }}
                                groupOptions={groupOptions}
                                organizationOptions={organizationOptions}
                                userOptions={userOptions}
                                value={targetScope}
                                onChange={(value) => {
                                    setTargetScope(value);
                                    clearJsonPrefillErrors(
                                        SKILL_JSON_PREFILL_FIELD.scope,
                                        SKILL_JSON_PREFILL_FIELD.organizationId,
                                        SKILL_JSON_PREFILL_FIELD.groupId,
                                        SKILL_JSON_PREFILL_FIELD.assignedUserId,
                                    );
                                }}
                            />
                            <FieldErrorMessage
                                id="skill-scope-error"
                                message={jsonPrefillFieldErrors.scope}
                            />
                        </Box>
                    </Box>

                    <Box className="my-8 h-px bg-[#ECEEF3]" />

                    <Text as="h2" className="text-[22px] font-extrabold text-[#111827]">
                        Dimensions de la compétence
                    </Text>

                    <Box className="mt-6 space-y-7">
                        <DimensionSection
                            disabled={hasProtectedUsage}
                            error={jsonPrefillFieldErrors[SKILL_JSON_PREFILL_FIELD.knowledge]}
                            errorField="skill-knowledge"
                            title="Savoir (Connaissances théoriques)"
                            placeholder="Ex: Comprendre les différents rôles du standard..."
                            items={knowledge}
                            itemErrors={getDimensionItemErrors(SKILL_JSON_PREFILL_FIELD.knowledge)}
                            onAdd={() => {
                                setKnowledge((current) => [...current, { label: "" }]);
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.knowledge);
                            }}
                            onChange={(index, value) => {
                                updateList(knowledge, setKnowledge, index, value);
                                clearJsonPrefillErrors(
                                    `${SKILL_JSON_PREFILL_FIELD.knowledge}.${index}`,
                                    SKILL_JSON_PREFILL_FIELD.knowledge,
                                );
                            }}
                            onRemove={(index) => {
                                setKnowledge((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.knowledge);
                            }}
                        />
                        <DimensionSection
                            disabled={hasProtectedUsage}
                            error={jsonPrefillFieldErrors[SKILL_JSON_PREFILL_FIELD.knowHow]}
                            errorField="skill-know-how"
                            title="Savoir-faire (Compétences pratiques)"
                            placeholder="Ex: Formuler une demande de mise en relation claire..."
                            items={knowHow}
                            itemErrors={getDimensionItemErrors(SKILL_JSON_PREFILL_FIELD.knowHow)}
                            onAdd={() => {
                                setKnowHow((current) => [...current, { label: "" }]);
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.knowHow);
                            }}
                            onChange={(index, value) => {
                                updateList(knowHow, setKnowHow, index, value);
                                clearJsonPrefillErrors(
                                    `${SKILL_JSON_PREFILL_FIELD.knowHow}.${index}`,
                                    SKILL_JSON_PREFILL_FIELD.knowHow,
                                );
                            }}
                            onRemove={(index) => {
                                setKnowHow((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.knowHow);
                            }}
                        />
                        <DimensionSection
                            disabled={hasProtectedUsage}
                            error={jsonPrefillFieldErrors[SKILL_JSON_PREFILL_FIELD.attitude]}
                            errorField="skill-attitude"
                            title="Savoir-être (Comportements et attitudes)"
                            placeholder="Ex: Adopter un ton assuré sans agressivité..."
                            items={attitude}
                            itemErrors={getDimensionItemErrors(SKILL_JSON_PREFILL_FIELD.attitude)}
                            onAdd={() => {
                                setAttitude((current) => [...current, { label: "" }]);
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.attitude);
                            }}
                            onChange={(index, value) => {
                                updateList(attitude, setAttitude, index, value);
                                clearJsonPrefillErrors(
                                    `${SKILL_JSON_PREFILL_FIELD.attitude}.${index}`,
                                    SKILL_JSON_PREFILL_FIELD.attitude,
                                );
                            }}
                            onRemove={(index) => {
                                setAttitude((current) => current.filter((_, itemIndex) => itemIndex !== index));
                                clearJsonPrefillErrorTree(SKILL_JSON_PREFILL_FIELD.attitude);
                            }}
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

            {creationModeDialogOpen && (
                <EntityCreationModeDialog
                    entityLabel="Compétence"
                    onClose={() => setCreationModeDialogOpen(false)}
                    onSelect={selectCreationMode}
                />
            )}

            {jsonPrefillDialogOpen && (
                <EntityJsonPrefillDialog
                    entityLabel="Compétence"
                    onClose={() => setJsonPrefillDialogOpen(false)}
                    onImport={importSkillJson}
                    prompt={buildSkillJsonPrefillPrompt({
                        groupOptions,
                        organizationOptions,
                        userOptions,
                    })}
                />
            )}
        </Box>
    );
}
