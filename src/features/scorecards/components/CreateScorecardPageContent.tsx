"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, FileUp, LockKeyhole, Plus } from "lucide-react";
import { ContextualBackLink } from "@/features/app-shell/components";
import {
    EntityCreationModeDialog,
    EntityJsonPrefillDialog,
} from "@/features/entity-json-prefill/components";
import {
    ENTITY_CREATION_MODE,
    ENTITY_CREATION_MODE_LABELS,
    type EntityCreationMode,
    type EntityJsonPrefillFieldErrors,
} from "@/features/entity-json-prefill/domain";
import {
    CONTENT_LEVELS,
    CONTENT_STATUS,
    getCategoriesForDomain,
    type ContentStatus,
    getEntitySelectionLabel,
} from "@/features/content/domain";
import { CONTENT_DOMAINS } from "@/features/content/domain";
import type { SaveScorecardInput } from "@/features/scorecards/dto";
import { getMethodSelectionLabel, toMethodSelectOption } from "@/features/methods/domain/method";
import {
    SCORECARD_CRITERION_DIMENSION_LABELS,
    SCORECARD_CRITERION_DIMENSIONS,
    SCORECARD_ROUTES,
    SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE,
    getScorecardStepWeightTotal,
    isCompleteScorecardStepWeighting,
    isScorecardStepWeight,
    SCORECARD_STEP_WEIGHT_MIN_PERCENT,
    SCORECARD_STEP_WEIGHT_TOTAL_PERCENT,
    SCORECARD_VISIBILITY,
    SCORECARD_VISIBILITY_DESCRIPTIONS,
    SCORECARD_VISIBILITY_LABELS,
    SCORECARD_VISIBILITIES,
    buildScorecardJsonPrefillPrompt,
    parseScorecardJsonPrefillText,
    type ScorecardDetail,
    type ScorecardEditorDetail,
    type ScorecardMethodOption,
    type ScorecardMethodStep,
    type ScorecardOrganizationOption,
    type ScorecardVisibility,
} from "@/features/scorecards/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { Box, Button, CardSurface, FieldErrorMessage, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import { AlertMessage, SingleSelectField, StatusMessage, type SingleSelectOption } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { ScorecardCriterionEditor } from "./ScorecardCriterionEditor";
import {
    emptyCriterion,
    emptyScorecardFormState,
    createFormId,
    integerFromText,
    numberFromText,
    scorecardDetailToFormState,
    stepsFromMethod,
    toSaveScorecardInput,
    type ScorecardCriterionFormState,
    type ScorecardFormState,
    type ScorecardStepFormState,
} from "./scorecard-form-state";

const dimensionOptions: SingleSelectOption[] = SCORECARD_CRITERION_DIMENSIONS.map((dimension) => ({
    label: SCORECARD_CRITERION_DIMENSION_LABELS[dimension],
    value: dimension,
}));

const levelOptions: SingleSelectOption[] = CONTENT_LEVELS.map((level) => ({ label: level, value: level }));

interface MethodApiPayload {
    error?: string;
    method?: {
        steps?: Array<{ id: string; order: number; title: string }>;
    };
}

interface ScorecardApiPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    scorecard?: { id: string };
}

interface CreateScorecardPageContentProps {
    initialScorecard?: ScorecardDetail & Partial<Pick<ScorecardEditorDetail, "hasUsage">>;
    methodOptions: ScorecardMethodOption[];
    organizationOptions: ScorecardOrganizationOption[];
    scorecardId?: string;
    skillOptions: SkillOption[];
}

async function saveScorecard(values: SaveScorecardInput, scorecardId?: string) {
    const response = await fetch(
        scorecardId ? SCORECARD_ROUTES.api.detail(scorecardId) : SCORECARD_ROUTES.api.collection,
        {
            body: JSON.stringify(values),
            headers: { "Content-Type": "application/json" },
            method: scorecardId ? "PATCH" : "POST",
        },
    );
    const payload = (await response.json().catch(() => null)) as ScorecardApiPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer la scorecard.",
        );
    }

    if (!payload?.scorecard) {
        throw new Error("La scorecard a été enregistrée mais la réponse est incomplète.");
    }

    return payload.scorecard;
}

async function duplicateScorecard(scorecardId: string) {
    const response = await fetch(SCORECARD_ROUTES.api.duplicate(scorecardId), {
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as ScorecardApiPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible de dupliquer la scorecard.",
        );
    }

    if (!payload?.scorecard) {
        throw new Error("La scorecard a été dupliquée mais la réponse est incomplète.");
    }

    return payload.scorecard;
}

export function CreateScorecardPageContent({
    initialScorecard,
    methodOptions,
    organizationOptions,
    scorecardId,
    skillOptions,
}: CreateScorecardPageContentProps) {
    const router = useRouter();
    const isEditing = Boolean(scorecardId);
    const hasExistingUsage = initialScorecard?.hasUsage ?? false;
    const [form, setForm] = useState<ScorecardFormState>(() =>
        initialScorecard ? scorecardDetailToFormState(initialScorecard) : emptyScorecardFormState(),
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [creationModeDialogOpen, setCreationModeDialogOpen] = useState(!isEditing);
    const [jsonPrefillDialogOpen, setJsonPrefillDialogOpen] = useState(false);
    const [jsonPrefillFieldErrors, setJsonPrefillFieldErrors] = useState<EntityJsonPrefillFieldErrors>({});
    const [jsonPrefillMessage, setJsonPrefillMessage] = useState<string | null>(null);
    const [duplicating, setDuplicating] = useState(false);
    const [importingMethod, setImportingMethod] = useState(false);
    const [savingStatus, setSavingStatus] = useState<ContentStatus | null>(null);

    const methodSelectOptions = methodOptions.map(toMethodSelectOption);
    const competenceOptions: SingleSelectOption[] = skillOptions.map((skill) => ({
        disabled: skill.isSelectable === false,
        label: getEntitySelectionLabel(skill.name, skill),
        value: skill.id,
    }));
    const organizationSelectOptions = organizationOptions.map((organization) => ({
        disabled: organization.isSelectable === false,
        label: getEntitySelectionLabel(organization.name, organization),
        value: organization.id,
    }));
    const selectedMethod = methodOptions.find((method) => method.id === form.methodId);
    const selectedMethodLabel = selectedMethod ? getMethodSelectionLabel(selectedMethod) : null;

    const totalCriteria = useMemo(
        () => form.steps.reduce((total, step) => total + step.criteria.length, 0),
        [form.steps],
    );
    const stepWeights = useMemo(
        () => form.steps.map((step) => numberFromText(step.weightPercent, 0)),
        [form.steps],
    );
    const totalWeight = useMemo(() => getScorecardStepWeightTotal(stepWeights), [stepWeights]);
    const hasValidStepWeights = stepWeights.every(isScorecardStepWeight);
    const hasCompleteStepWeighting = isCompleteScorecardStepWeighting(stepWeights);

    const isPrivate = form.visibility === SCORECARD_VISIBILITY.private;
    const scopeTargetReady = !isPrivate || Boolean(form.organizationId);
    const criteriaComplete = form.steps.every(
        (step) =>
            step.criteria.length > 0 &&
            step.criteria.every(
                (criterion) =>
                    criterion.key.trim().length > 0 &&
                    criterion.expectedEvidence.trim().length > 0 &&
                    criterion.verbatim.trim().length > 0 &&
                    Boolean(criterion.competenceId) &&
                    Boolean(criterion.dimension) &&
                    Boolean(criterion.dimensionItemId) &&
                    integerFromText(criterion.maxPoints, 0) > 0,
            ),
    );
    const canSubmit =
        form.name.trim().length > 0 &&
        Boolean(form.methodId) &&
        scopeTargetReady &&
        hasValidStepWeights &&
        Object.keys(jsonPrefillFieldErrors).length === 0;
    const canPublish =
        canSubmit &&
        form.steps.length > 0 &&
        totalCriteria > 0 &&
        criteriaComplete &&
        hasCompleteStepWeighting;
    const isSaving = savingStatus !== null;
    const isDraft = !initialScorecard || initialScorecard.status === CONTENT_STATUS.draft;

    function clearJsonPrefillError(path: string, descendants = false) {
        setJsonPrefillFieldErrors((current) => {
            const next = { ...current };
            let changed = false;
            for (const key of Object.keys(next)) {
                if (key === path || (descendants && key.startsWith(`${path}.`))) {
                    delete next[key];
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }

    function patch<K extends keyof ScorecardFormState>(key: K, value: ScorecardFormState[K]) {
        clearJsonPrefillError(key, true);
        setForm((current) => ({ ...current, [key]: value }));
    }

    function selectCreationMode(mode: EntityCreationMode) {
        setCreationModeDialogOpen(false);
        if (mode === ENTITY_CREATION_MODE.json) setJsonPrefillDialogOpen(true);
    }

    async function importScorecardJson(file: File) {
        const result = parseScorecardJsonPrefillText(await file.text(), {
            methodOptions,
            organizationOptions,
            skillOptions,
        });
        setForm({
            ...result.draft,
            steps: result.draft.steps.map((step) => ({
                collapsed: false,
                criteria: step.criteria.map((criterion, criterionIndex) => ({
                    ...criterion,
                    id: createFormId(),
                    maxPoints: String(criterion.maxPoints),
                    order: String(criterionIndex + 1),
                })),
                id: createFormId(),
                methodStepId: step.methodStepId,
                name: step.name,
                order: step.order,
                weightPercent: String(step.weightPercent),
            })),
        });
        setJsonPrefillFieldErrors(result.fieldErrors);
        setJsonPrefillMessage(
            Object.keys(result.fieldErrors).length > 0
                ? "Le fichier a été appliqué. Corrigez les champs signalés avant d’enregistrer."
                : "Le fichier JSON a correctement prérempli la scorecard.",
        );
        setFormError(null);
    }

    function updateStep(stepId: string, updater: (step: ScorecardStepFormState) => ScorecardStepFormState) {
        setForm((current) => ({
            ...current,
            steps: current.steps.map((step) => (step.id === stepId ? updater(step) : step)),
        }));
    }

    function addCriterion(stepId: string) {
        clearJsonPrefillError("steps");
        updateStep(stepId, (step) => ({
            ...step,
            collapsed: false,
            criteria: [...step.criteria, emptyCriterion(step.criteria.length + 1)],
        }));
    }

    function updateCriterion(
        stepId: string,
        criterionId: string,
        patchCriterion: Partial<ScorecardCriterionFormState>,
    ) {
        const stepIndex = form.steps.findIndex((step) => step.id === stepId);
        const criterionIndex = form.steps[stepIndex]?.criteria.findIndex((criterion) => criterion.id === criterionId) ?? -1;
        if (stepIndex >= 0 && criterionIndex >= 0) {
            Object.keys(patchCriterion).forEach((field) =>
                clearJsonPrefillError(`steps.${stepIndex}.criteria.${criterionIndex}.${field}`),
            );
        }
        updateStep(stepId, (step) => ({
            ...step,
            criteria: step.criteria.map((criterion) =>
                criterion.id === criterionId ? { ...criterion, ...patchCriterion } : criterion,
            ),
        }));
    }

    function removeCriterion(stepId: string, criterionId: string) {
        clearJsonPrefillError("steps");
        updateStep(stepId, (step) => ({
            ...step,
            criteria: step.criteria.filter((criterion) => criterion.id !== criterionId),
        }));
    }

    function getDimensionItemOptions(criterion: ScorecardCriterionFormState): SingleSelectOption[] {
        if (!criterion.competenceId || !criterion.dimension) {
            return [];
        }

        const skill = skillOptions.find((option) => option.id === criterion.competenceId);

        return (skill?.dimensionItems ?? [])
            .filter((item) => item.isActive && item.dimension === criterion.dimension)
            .slice()
            .sort((first, second) => first.order - second.order)
            .map((item) => ({
                label: item.label,
                value: item.id,
            }));
    }

    async function selectMethod(methodId: string) {
        if (hasExistingUsage || !methodId || methodId === form.methodId || importingMethod) {
            return;
        }

        setImportingMethod(true);
        setFormError(null);
        clearJsonPrefillError("methodId");
        clearJsonPrefillError("steps", true);

        try {
            const response = await fetch(`/api/methods/${methodId}`);
            const payload = (await response.json().catch(() => null)) as MethodApiPayload | null;

            if (!response.ok || !payload?.method) {
                throw new Error(payload?.error || "Impossible de récupérer la méthode.");
            }

            const methodSteps: ScorecardMethodStep[] = (payload.method.steps ?? []).map((step) => ({
                id: step.id,
                order: step.order,
                title: step.title,
            }));

            setForm((current) => ({ ...current, methodId, steps: stepsFromMethod(methodSteps) }));
        } catch (error) {
            setForm((current) => ({ ...current, methodId, steps: [] }));
            setFormError(error instanceof Error ? error.message : "Impossible d'importer les étapes.");
        } finally {
            setImportingMethod(false);
        }
    }

    async function handleSave(status: ContentStatus) {
        if (
            isSaving ||
            duplicating ||
            (status === CONTENT_STATUS.published ? !canPublish : !canSubmit)
        ) {
            return;
        }

        setFormError(null);
        setSavingStatus(status);

        try {
            const saved = await saveScorecard(toSaveScorecardInput(form, status), scorecardId);
            notifyFormSubmitSuccess();
            router.push(isEditing ? SCORECARD_ROUTES.app.detail(saved.id) : SCORECARD_ROUTES.app.collection);
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer la scorecard."));
        } finally {
            setSavingStatus(null);
        }
    }

    async function handleDuplicate() {
        if (!scorecardId || duplicating || isSaving) return;

        setFormError(null);
        setDuplicating(true);
        try {
            const duplicate = await duplicateScorecard(scorecardId);
            router.push(SCORECARD_ROUTES.app.edit(duplicate.id));
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de dupliquer la scorecard."));
        } finally {
            setDuplicating(false);
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[900px]">
                <Box className={uiTokens.jsonPrefill.formHeader}>
                    <Box className="flex items-center gap-4">
                        <ContextualBackLink
                            fallbackHref={
                                isEditing && scorecardId
                                    ? SCORECARD_ROUTES.app.detail(scorecardId)
                                    : SCORECARD_ROUTES.app.collection
                            }
                            aria-label="Retour"
                            className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                                uiTokens.text.heading,
                            )}
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Text as="h1" className={cn("text-[28px] font-extrabold leading-tight", uiTokens.text.heading)}>
                            {isEditing ? "Modifier la scorecard" : "Ajouter une scorecard"}
                        </Text>
                    </Box>
                    {!isEditing && (
                        <Button onClick={() => setJsonPrefillDialogOpen(true)} className={uiTokens.action.secondaryButton}>
                            <InlineIcon icon={FileUp} className="h-4 w-4" />
                            {ENTITY_CREATION_MODE_LABELS.json}
                        </Button>
                    )}
                </Box>

                <Box className="space-y-6">
                    {formError && <AlertMessage message={formError} />}

                    {hasExistingUsage && (
                        <Box
                            className={cn(
                                "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                                uiTokens.surface.mutedPanel,
                            )}
                        >
                            <Box className="flex min-w-0 items-start gap-3">
                                <InlineIcon
                                    icon={LockKeyhole}
                                    className={cn("mt-0.5 h-4 w-4 shrink-0", uiTokens.text.primary)}
                                />
                                <Text className={cn("text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                                    {SCORECARD_USAGE_EDIT_RESTRICTION_MESSAGE}
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

                    <CardSurface className={uiTokens.surface.formCard}>
                        {jsonPrefillMessage && (
                            <Box className={uiTokens.jsonPrefill.formNotice}>
                                <StatusMessage
                                    tone={Object.keys(jsonPrefillFieldErrors).length > 0 ? "info" : "success"}
                                    message={jsonPrefillMessage}
                                />
                            </Box>
                        )}
                        <SectionHeading title="Informations générales" />
                        <Box className="mt-6 space-y-5">
                            <Box>
                                <FieldLabel required className={uiTokens.form.label}>Nom de la scorecard</FieldLabel>
                                <TextInput
                                    aria-invalid={Boolean(jsonPrefillFieldErrors.name)}
                                    value={form.name}
                                    onChange={(event) => patch("name", event.target.value)}
                                    placeholder="Ex : Scorecard DAGO — Prise de rendez-vous"
                                    hasLeadingIcon={false}
                                    className={cn(jsonPrefillFieldErrors.name && uiTokens.form.controlError)}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.name} />
                            </Box>

                            <Box>
                                <FieldLabel required className={uiTokens.form.label}>Méthode associée</FieldLabel>
                                <SingleSelectField
                                    disabled={hasExistingUsage}
                                    hasError={Boolean(jsonPrefillFieldErrors.methodId)}
                                    options={methodSelectOptions}
                                    value={form.methodId}
                                    placeholder="Sélectionner une méthode"
                                    onChange={(value) => void selectMethod(value)}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.methodId} />
                                {selectedMethodLabel && form.steps.length > 0 && (
                                    <Text className={cn("mt-2 flex items-center gap-1.5 text-[13px] font-semibold", uiTokens.text.success)}>
                                        <InlineIcon icon={Check} className="h-4 w-4" />
                                        Les étapes de la méthode {selectedMethodLabel} ont été importées automatiquement
                                    </Text>
                                )}
                            </Box>

                            <Box className="grid gap-5 sm:grid-cols-2">
                                <Box>
                                    <FieldLabel className={uiTokens.form.label}>Domaine</FieldLabel>
                                    <SingleSelectField
                                        disabled={hasExistingUsage}
                                        hasError={Boolean(jsonPrefillFieldErrors.domain)}
                                        options={[...CONTENT_DOMAINS]}
                                        value={form.domain}
                                        placeholder="Sélectionner un domaine"
                                        onChange={(value) => {
                                            clearJsonPrefillError("domain");
                                            setForm((current) => ({ ...current, category: null, domain: value }));
                                        }}
                                    />
                                    <FieldErrorMessage message={jsonPrefillFieldErrors.domain} />
                                </Box>
                                <Box>
                                    <FieldLabel className={uiTokens.form.label}>Catégorie</FieldLabel>
                                    <SingleSelectField
                                        disabled={hasExistingUsage || !form.domain}
                                        hasError={Boolean(jsonPrefillFieldErrors.category)}
                                        options={[...getCategoriesForDomain(form.domain)]}
                                        value={form.category}
                                        placeholder={
                                            form.domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"
                                        }
                                        onChange={(value) => patch("category", value)}
                                    />
                                    <FieldErrorMessage message={jsonPrefillFieldErrors.category} />
                                </Box>
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Niveau</FieldLabel>
                                <SingleSelectField
                                    disabled={hasExistingUsage}
                                    hasError={Boolean(jsonPrefillFieldErrors.level)}
                                    options={levelOptions}
                                    value={form.level}
                                    placeholder="Sélectionner un niveau"
                                    onChange={(value) => patch("level", value)}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.level} />
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Description</FieldLabel>
                                <TextArea
                                    aria-invalid={Boolean(jsonPrefillFieldErrors.description)}
                                    value={form.description}
                                    onChange={(event) => patch("description", event.target.value)}
                                    placeholder="Ex : Grille d'évaluation du roleplay DAGO"
                                    rows={3}
                                    className={cn(jsonPrefillFieldErrors.description && uiTokens.form.controlError)}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.description} />
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Visibilité</FieldLabel>
                                <Box className="space-y-2.5">
                                    {SCORECARD_VISIBILITIES.map((visibility) => (
                                        <VisibilityRadio
                                            disabled={hasExistingUsage}
                                            key={visibility}
                                            selected={form.visibility === visibility}
                                            title={SCORECARD_VISIBILITY_LABELS[visibility]}
                                            description={SCORECARD_VISIBILITY_DESCRIPTIONS[visibility]}
                                            onSelect={() => {
                                                clearJsonPrefillError("visibility");
                                                if (visibility === SCORECARD_VISIBILITY.public) {
                                                    clearJsonPrefillError("organizationId");
                                                }
                                                setForm((current) => ({
                                                    ...current,
                                                    organizationId:
                                                        visibility === SCORECARD_VISIBILITY.private
                                                            ? current.organizationId
                                                            : null,
                                                    visibility: visibility as ScorecardVisibility,
                                                }));
                                            }}
                                        />
                                    ))}
                                </Box>
                                <FieldErrorMessage message={jsonPrefillFieldErrors.visibility} />
                                {isPrivate && (
                                    <Box className="mt-3">
                                        <FieldLabel required className={uiTokens.form.label}>Organisation</FieldLabel>
                                        <SingleSelectField
                                            disabled={hasExistingUsage}
                                            hasError={Boolean(jsonPrefillFieldErrors.organizationId)}
                                            options={organizationSelectOptions}
                                            value={form.organizationId}
                                            placeholder="Sélectionner une organisation..."
                                            onChange={(value) => patch("organizationId", value)}
                                        />
                                    </Box>
                                )}
                                <FieldErrorMessage message={jsonPrefillFieldErrors.organizationId} />
                            </Box>
                        </Box>

                        <Box className={uiTokens.surface.divider} />

                        <Box className="flex flex-wrap items-center justify-between gap-4">
                            <SectionHeading title="Étapes et critères observables" />
                            {form.steps.length > 0 && (
                                <Box className="flex flex-wrap items-center justify-end gap-2">
                                    <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                                        {form.steps.length} étape{form.steps.length > 1 ? "s" : ""} importée
                                        {form.steps.length > 1 ? "s" : ""}
                                    </Text>
                                    <Text
                                        className={cn(
                                            "inline-flex items-center rounded-lg border px-2.5 py-1 text-[12px] font-bold",
                                            hasCompleteStepWeighting
                                                ? uiTokens.tone.success.soft
                                                : uiTokens.tone.warning.soft,
                                        )}
                                    >
                                        Pondération : {totalWeight}%
                                        {!hasCompleteStepWeighting
                                            ? ` · ${SCORECARD_STEP_WEIGHT_TOTAL_PERCENT}% requis`
                                            : ""}
                                    </Text>
                                </Box>
                            )}
                        </Box>
                        <FieldErrorMessage message={jsonPrefillFieldErrors.steps} />

                        {form.steps.length === 0 ? (
                            <Box className={cn("mt-6", uiTokens.surface.emptyState)}>
                                <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                                    Sélectionnez une méthode pour importer les étapes automatiquement
                                </Text>
                            </Box>
                        ) : (
                            <Box className="mt-6 space-y-4">
                                {form.steps.map((step, stepIndex) => (
                                    <CardSurface key={step.id} className={uiTokens.surface.stepCard}>
                                        <Box className="flex flex-wrap items-center gap-3">
                                            <Box className={uiTokens.badge.stepNumber}>{stepIndex + 1}</Box>
                                            <Text className={cn("min-w-[180px] flex-1 text-[15px] font-bold", uiTokens.text.heading)}>
                                                {step.name}
                                            </Text>
                                            <Box className="flex shrink-0 items-center gap-1.5">
                                                <FieldLabel className={uiTokens.form.subLabel}>Poids</FieldLabel>
                                                <TextInput
                                                    aria-label={`Poids de l'étape ${stepIndex + 1}`}
                                                    type="number"
                                                    min={SCORECARD_STEP_WEIGHT_MIN_PERCENT}
                                                    max={SCORECARD_STEP_WEIGHT_TOTAL_PERCENT}
                                                    step={SCORECARD_STEP_WEIGHT_MIN_PERCENT}
                                                    value={step.weightPercent}
                                                    onChange={(event) =>
                                                        {
                                                            clearJsonPrefillError(`steps.${stepIndex}.weightPercent`);
                                                            clearJsonPrefillError("steps");
                                                            updateStep(step.id, (current) => ({
                                                                ...current,
                                                                weightPercent: event.target.value,
                                                            }));
                                                        }
                                                    }
                                                    hasLeadingIcon={false}
                                                    density="sm"
                                                    className={cn(
                                                        uiTokens.form.controlWhite,
                                                        "w-[76px]",
                                                        jsonPrefillFieldErrors[`steps.${stepIndex}.weightPercent`] && uiTokens.form.controlError,
                                                    )}
                                                />
                                                <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                                                    %
                                                </Text>
                                            </Box>
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.methodStepId`]} />
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.weightPercent`]} />
                                            <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                                {step.criteria.length} critère{step.criteria.length > 1 ? "s" : ""}
                                            </Text>
                                            <Button
                                                aria-label={step.collapsed ? "Déplier l'étape" : "Replier l'étape"}
                                                onClick={() =>
                                                    updateStep(step.id, (current) => ({
                                                        ...current,
                                                        collapsed: !current.collapsed,
                                                    }))
                                                }
                                                className={uiTokens.action.iconButtonGhost}
                                            >
                                                <InlineIcon
                                                    icon={step.collapsed ? ChevronDown : ChevronUp}
                                                    className="h-4 w-4"
                                                />
                                            </Button>
                                        </Box>

                                        {!step.collapsed && (
                                            <Box className="mt-4 space-y-3">
                                                <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.criteria`]} />
                                                {step.criteria.length === 0 ? (
                                                    <Text className={cn("py-4 text-center text-[13px] italic", uiTokens.text.muted)}>
                                                        Aucun critère pour cette étape. Cliquez sur « + Ajouter un critère ».
                                                    </Text>
                                                ) : (
                                                    step.criteria.map((criterion, criterionIndex) => (
                                                        <ScorecardCriterionEditor
                                                            key={criterion.id}
                                                            competenceOptions={competenceOptions}
                                                            criterion={criterion}
                                                            dimensionItemOptions={getDimensionItemOptions(criterion)}
                                                            dimensionOptions={dimensionOptions}
                                                            index={criterionIndex}
                                                            fieldErrors={Object.fromEntries(
                                                                Object.entries(jsonPrefillFieldErrors)
                                                                    .filter(([path]) => path.startsWith(`steps.${stepIndex}.criteria.${criterionIndex}.`))
                                                                    .map(([path, message]) => [
                                                                        path.slice(`steps.${stepIndex}.criteria.${criterionIndex}.`.length),
                                                                        message,
                                                                    ]),
                                                            )}
                                                            onClearError={(field) =>
                                                                clearJsonPrefillError(`steps.${stepIndex}.criteria.${criterionIndex}.${field}`)
                                                            }
                                                            onPatch={(patchCriterion) =>
                                                                updateCriterion(step.id, criterion.id, patchCriterion)
                                                            }
                                                            onRemove={() => removeCriterion(step.id, criterion.id)}
                                                            structureLocked={hasExistingUsage}
                                                        />
                                                    ))
                                                )}
                                                <Button
                                                    disabled={hasExistingUsage}
                                                    onClick={() => addCriterion(step.id)}
                                                    className={cn(
                                                        uiTokens.action.addButton,
                                                        "w-full justify-center disabled:cursor-not-allowed disabled:opacity-50",
                                                    )}
                                                >
                                                    <InlineIcon icon={Plus} className="h-4 w-4" />
                                                    Ajouter un critère
                                                </Button>
                                            </Box>
                                        )}
                                    </CardSurface>
                                ))}
                            </Box>
                        )}
                    </CardSurface>

                    <Box className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        {isDraft && (
                            <Button
                                disabled={!canSubmit || isSaving || duplicating}
                                onClick={() => void handleSave(CONTENT_STATUS.draft)}
                                className={cn(uiTokens.action.secondaryButton, "disabled:cursor-not-allowed disabled:opacity-60")}
                            >
                                {savingStatus === CONTENT_STATUS.draft
                                    ? "Enregistrement..."
                                    : "Enregistrer en brouillon"}
                            </Button>
                        )}
                        <Button
                            disabled={!canPublish || isSaving || duplicating}
                            onClick={() => void handleSave(CONTENT_STATUS.published)}
                            className={cn(
                                "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition",
                                canPublish && !isSaving && !duplicating
                                    ? uiTokens.action.primaryButton
                                    : uiTokens.action.primaryButtonDisabled,
                            )}
                        >
                            {savingStatus === CONTENT_STATUS.published
                                ? "Enregistrement..."
                                : isDraft
                                  ? "Publier la scorecard"
                                  : "Enregistrer les modifications"}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {creationModeDialogOpen && (
                <EntityCreationModeDialog
                    entityLabel="Scorecard"
                    onClose={() => setCreationModeDialogOpen(false)}
                    onSelect={selectCreationMode}
                />
            )}
            {jsonPrefillDialogOpen && (
                <EntityJsonPrefillDialog
                    entityLabel="Scorecard"
                    onClose={() => setJsonPrefillDialogOpen(false)}
                    onImport={importScorecardJson}
                    prompt={buildScorecardJsonPrefillPrompt({ methodOptions, organizationOptions, skillOptions })}
                />
            )}
        </Box>
    );
}

function SectionHeading({ title }: { title: string }) {
    return (
        <Text as="h2" className={cn("text-[18px] font-extrabold", uiTokens.text.heading)}>
            {title}
        </Text>
    );
}

function VisibilityRadio({
    description,
    disabled,
    onSelect,
    selected,
    title,
}: {
    description: string;
    disabled?: boolean;
    onSelect: () => void;
    selected: boolean;
    title: string;
}) {
    return (
        <Button
            disabled={disabled}
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                uiTokens.radio.option,
                selected ? uiTokens.radio.optionSelected : uiTokens.radio.optionIdle,
                "disabled:cursor-not-allowed disabled:opacity-60",
            )}
        >
            <Box className={cn(uiTokens.radio.ring, selected ? uiTokens.radio.ringSelected : uiTokens.radio.ringIdle)}>
                {selected && <Box className={uiTokens.radio.dot} />}
            </Box>
            <Text as="span" className="text-[14px] text-[#374151]">
                <Text as="span" className="font-bold text-[#111827]">
                    {title}
                </Text>{" "}
                — {description}
            </Text>
        </Button>
    );
}
