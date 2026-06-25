"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import {
    CONTENT_LEVELS,
    CONTENT_STATUS,
    getCategoriesForDomain,
    type ContentStatus,
} from "@/features/content/domain";
import { CONTENT_DOMAINS } from "@/features/content/domain";
import { QUIZ_DIMENSION_LABELS, QUIZ_DIMENSIONS } from "@/features/evaluations/domain";
import type { SaveScorecardInput } from "@/features/scorecards/dto";
import {
    SCORECARD_VISIBILITY,
    SCORECARD_VISIBILITY_DESCRIPTIONS,
    SCORECARD_VISIBILITY_LABELS,
    SCORECARD_VISIBILITIES,
    type ScorecardMethodOption,
    type ScorecardMethodStep,
    type ScorecardOrganizationOption,
    type ScorecardVisibility,
} from "@/features/scorecards/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { Box, Button, CardSurface, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import { AlertMessage, SingleSelectField, type SingleSelectOption } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { ScorecardCriterionEditor } from "./ScorecardCriterionEditor";
import {
    emptyCriterion,
    emptyScorecardFormState,
    integerFromText,
    stepsFromMethod,
    toSaveScorecardInput,
    type ScorecardCriterionFormState,
    type ScorecardFormState,
    type ScorecardStepFormState,
} from "./scorecard-form-state";

const dimensionOptions: SingleSelectOption[] = QUIZ_DIMENSIONS.map((dimension) => ({
    label: QUIZ_DIMENSION_LABELS[dimension],
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
    methodOptions: ScorecardMethodOption[];
    organizationOptions: ScorecardOrganizationOption[];
    skillOptions: SkillOption[];
}

async function saveScorecard(values: SaveScorecardInput) {
    const response = await fetch("/api/scorecards", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as ScorecardApiPayload | null;

    if (!response.ok) {
        const validationMessage = payload?.issues?.map((issue) => issue.message).join(" ");
        throw new Error(validationMessage || payload?.error || "Impossible d'enregistrer la scorecard.");
    }

    if (!payload?.scorecard) {
        throw new Error("La scorecard a été enregistrée mais la réponse est incomplète.");
    }

    return payload.scorecard;
}

export function CreateScorecardPageContent({
    methodOptions,
    organizationOptions,
    skillOptions,
}: CreateScorecardPageContentProps) {
    const router = useRouter();
    const [form, setForm] = useState<ScorecardFormState>(() => emptyScorecardFormState());
    const [formError, setFormError] = useState<string | null>(null);
    const [importingMethod, setImportingMethod] = useState(false);
    const [savingStatus, setSavingStatus] = useState<ContentStatus | null>(null);

    const methodSelectOptions = methodOptions.map((method) => ({
        label: method.shortName,
        value: method.id,
    }));
    const competenceOptions: SingleSelectOption[] = skillOptions.map((skill) => ({
        label: skill.name,
        value: skill.id,
    }));
    const organizationSelectOptions = organizationOptions.map((organization) => ({
        label: organization.name,
        value: organization.id,
    }));
    const selectedMethodLabel = methodOptions.find((method) => method.id === form.methodId)?.shortName ?? null;

    const totalCriteria = useMemo(
        () => form.steps.reduce((total, step) => total + step.criteria.length, 0),
        [form.steps],
    );

    const isPrivate = form.visibility === SCORECARD_VISIBILITY.private;
    const scopeTargetReady = !isPrivate || Boolean(form.organizationId);
    const criteriaComplete = form.steps.every(
        (step) =>
            step.criteria.length > 0 &&
            step.criteria.every(
                (criterion) =>
                    criterion.key.trim().length > 0 &&
                    criterion.expectedEvidence.trim().length > 0 &&
                    Boolean(criterion.competenceId) &&
                    Boolean(criterion.dimension) &&
                    Boolean(criterion.dimensionItemId) &&
                    integerFromText(criterion.maxPoints, 0) > 0,
            ),
    );
    const canSubmit = form.name.trim().length > 0 && Boolean(form.methodId) && scopeTargetReady;
    const canPublish = canSubmit && form.steps.length > 0 && totalCriteria > 0 && criteriaComplete;
    const isSaving = savingStatus !== null;

    function patch<K extends keyof ScorecardFormState>(key: K, value: ScorecardFormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function updateStep(stepId: string, updater: (step: ScorecardStepFormState) => ScorecardStepFormState) {
        setForm((current) => ({
            ...current,
            steps: current.steps.map((step) => (step.id === stepId ? updater(step) : step)),
        }));
    }

    function addCriterion(stepId: string) {
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
        updateStep(stepId, (step) => ({
            ...step,
            criteria: step.criteria.map((criterion) =>
                criterion.id === criterionId ? { ...criterion, ...patchCriterion } : criterion,
            ),
        }));
    }

    function removeCriterion(stepId: string, criterionId: string) {
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
        if (!methodId || methodId === form.methodId || importingMethod) {
            return;
        }

        setImportingMethod(true);
        setFormError(null);

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
        if (isSaving || (status === CONTENT_STATUS.published ? !canPublish : !canSubmit)) {
            return;
        }

        setFormError(null);
        setSavingStatus(status);

        try {
            await saveScorecard(toSaveScorecardInput(form, status));
            router.push("/scorecards");
            router.refresh();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Impossible d'enregistrer la scorecard.");
        } finally {
            setSavingStatus(null);
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[900px]">
                <Box className="mb-6 flex items-center gap-4">
                    <Link
                        href="/scorecards"
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </Link>
                    <Text as="h1" className={cn("text-[28px] font-extrabold leading-tight", uiTokens.text.heading)}>
                        Ajouter une scorecard
                    </Text>
                </Box>

                <Box className="space-y-6">
                    {formError && <AlertMessage message={formError} />}

                    <CardSurface className={uiTokens.surface.formCard}>
                        <SectionHeading title="Informations générales" />
                        <Box className="mt-6 space-y-5">
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>
                                    Nom de la scorecard <RequiredMark />
                                </FieldLabel>
                                <TextInput
                                    value={form.name}
                                    onChange={(event) => patch("name", event.target.value)}
                                    placeholder="Ex : Scorecard DAGO — Prise de rendez-vous"
                                    hasLeadingIcon={false}
                                />
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>
                                    Méthode associée <RequiredMark />
                                </FieldLabel>
                                <SingleSelectField
                                    options={methodSelectOptions}
                                    value={form.methodId}
                                    placeholder="Sélectionner une méthode"
                                    onChange={(value) => void selectMethod(value)}
                                />
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
                                        options={[...CONTENT_DOMAINS]}
                                        value={form.domain}
                                        placeholder="Sélectionner un domaine"
                                        onChange={(value) =>
                                            setForm((current) => ({ ...current, category: null, domain: value }))
                                        }
                                    />
                                </Box>
                                <Box>
                                    <FieldLabel className={uiTokens.form.label}>Catégorie</FieldLabel>
                                    <SingleSelectField
                                        disabled={!form.domain}
                                        options={[...getCategoriesForDomain(form.domain)]}
                                        value={form.category}
                                        placeholder={
                                            form.domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"
                                        }
                                        onChange={(value) => patch("category", value)}
                                    />
                                </Box>
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Niveau</FieldLabel>
                                <SingleSelectField
                                    options={levelOptions}
                                    value={form.level}
                                    placeholder="Sélectionner un niveau"
                                    onChange={(value) => patch("level", value)}
                                />
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Description</FieldLabel>
                                <TextArea
                                    value={form.description}
                                    onChange={(event) => patch("description", event.target.value)}
                                    placeholder="Ex : Grille d'évaluation du roleplay DAGO"
                                    rows={3}
                                />
                            </Box>

                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Visibilité</FieldLabel>
                                <Box className="space-y-2.5">
                                    {SCORECARD_VISIBILITIES.map((visibility) => (
                                        <VisibilityRadio
                                            key={visibility}
                                            selected={form.visibility === visibility}
                                            title={SCORECARD_VISIBILITY_LABELS[visibility]}
                                            description={SCORECARD_VISIBILITY_DESCRIPTIONS[visibility]}
                                            onSelect={() =>
                                                setForm((current) => ({
                                                    ...current,
                                                    organizationId:
                                                        visibility === SCORECARD_VISIBILITY.private
                                                            ? current.organizationId
                                                            : null,
                                                    visibility: visibility as ScorecardVisibility,
                                                }))
                                            }
                                        />
                                    ))}
                                </Box>
                                {isPrivate && (
                                    <Box className="mt-3">
                                        <FieldLabel className={uiTokens.form.label}>Organisation</FieldLabel>
                                        <SingleSelectField
                                            options={organizationSelectOptions}
                                            value={form.organizationId}
                                            placeholder="Sélectionner une organisation..."
                                            onChange={(value) => patch("organizationId", value)}
                                        />
                                    </Box>
                                )}
                            </Box>
                        </Box>

                        <Box className={uiTokens.surface.divider} />

                        <Box className="flex items-center justify-between gap-4">
                            <SectionHeading title="Étapes et critères observables" />
                            {form.steps.length > 0 && (
                                <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                                    {form.steps.length} étape{form.steps.length > 1 ? "s" : ""} importée
                                    {form.steps.length > 1 ? "s" : ""}
                                </Text>
                            )}
                        </Box>

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
                                        <Box className="flex items-center gap-3">
                                            <Box className={uiTokens.badge.stepNumber}>{stepIndex + 1}</Box>
                                            <Text className={cn("flex-1 text-[15px] font-bold", uiTokens.text.heading)}>
                                                {step.name}
                                            </Text>
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
                                                            onPatch={(patchCriterion) =>
                                                                updateCriterion(step.id, criterion.id, patchCriterion)
                                                            }
                                                            onRemove={() => removeCriterion(step.id, criterion.id)}
                                                        />
                                                    ))
                                                )}
                                                <Button
                                                    onClick={() => addCriterion(step.id)}
                                                    className={cn(uiTokens.action.addButton, "w-full justify-center")}
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
                        <Button
                            disabled={!canSubmit || isSaving}
                            onClick={() => void handleSave(CONTENT_STATUS.draft)}
                            className={cn(uiTokens.action.secondaryButton, "disabled:cursor-not-allowed disabled:opacity-60")}
                        >
                            {savingStatus === CONTENT_STATUS.draft ? "Enregistrement..." : "Enregistrer en brouillon"}
                        </Button>
                        <Button
                            disabled={!canPublish || isSaving}
                            onClick={() => void handleSave(CONTENT_STATUS.published)}
                            className={cn(
                                "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition",
                                canPublish && !isSaving
                                    ? uiTokens.action.primaryButton
                                    : uiTokens.action.primaryButtonDisabled,
                            )}
                        >
                            {savingStatus === CONTENT_STATUS.published ? "Publication..." : "Publier la scorecard"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

function RequiredMark() {
    return (
        <Text as="span" className={uiTokens.text.required}>
            *
        </Text>
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
    onSelect,
    selected,
    title,
}: {
    description: string;
    onSelect: () => void;
    selected: boolean;
    title: string;
}) {
    return (
        <Button
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(uiTokens.radio.option, selected ? uiTokens.radio.optionSelected : uiTokens.radio.optionIdle)}
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
