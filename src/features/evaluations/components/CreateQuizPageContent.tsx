"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { ContextualBackLink, useContextualReturnHref } from "@/features/app-shell/components";
import { buildPostSaveHref } from "@/features/app-shell/domain";
import type { ContentStatus } from "@/features/content/domain";
import { CONTENT_STATUS, getCategoriesForDomain } from "@/features/content/domain";
import {
    QUIZ_PARTICIPATION_LABELS,
    QUIZ_PARTICIPATIONS,
    QUIZ_TYPE_LABELS,
    QUIZ_TYPES,
    hasActiveQuizKnowledgeItem,
    type QuizDetail,
    type QuizGroupOption,
    type QuizMethodOption,
    type QuizOrganizationOption,
    type QuizParticipation,
    type QuizQuestionType,
    type QuizType,
    type QuizUserOption,
} from "@/features/evaluations/domain";
import type { SaveQuizInput } from "@/features/evaluations/dto";
import { getMethodSelectionLabel, toMethodSelectOption } from "@/features/methods/domain/method";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import type { PendingDirectUpload } from "@/lib/uploads/direct-upload";
import { submitWithDirectUploads } from "@/lib/uploads/direct-upload.client";
import { Box, Button, CardSurface, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import {
    AlertMessage,
    SearchableMultiSelectField,
    SegmentedControl,
    SingleSelectField,
    type SearchableOption,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { QuizQuestionEditor } from "./QuizQuestionEditor";
import {
    DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
    createQuizStepsFromMethod,
    domainOptions,
    emptyAttachment,
    emptyChoice,
    emptyQuestion,
    emptyStep,
    inferQuizAttachmentType,
    integerFromText,
    normalizeChoicesForQuestionType,
    quizToFormState,
    toSaveQuizInput,
    type QuizAttachmentDeliveryType,
    type QuizChoiceFormState,
    type QuizFormState,
    type QuizQuestionFormState,
    type QuizStepFormState,
} from "./quiz-form-state";

interface ApiErrorPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    quiz?: QuizDetail;
}

interface CreateQuizPageContentProps {
    groupOptions: QuizGroupOption[];
    initialQuiz?: QuizDetail;
    methodOptions: QuizMethodOption[];
    organizationOptions: QuizOrganizationOption[];
    skillOptions: SkillOption[];
    userOptions: QuizUserOption[];
}

type QuizUploadFile = PendingDirectUpload;

const attemptLimitOptions = [
    { label: "Limitées", value: "limited" },
    { label: "Illimitées", value: "unlimited" },
] as const;

function createClientFileId(prefix: string) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

async function saveQuiz(quizId: string | undefined, values: SaveQuizInput) {
    const response = await fetch(quizId ? `/api/quizzes/${quizId}` : "/api/quizzes", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: quizId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer le quiz.",
        );
    }

    if (!payload?.quiz) {
        throw new Error("Le quiz a été enregistré mais la réponse est incomplète.");
    }

    return payload.quiz;
}

export function CreateQuizPageContent({
    groupOptions,
    initialQuiz,
    methodOptions,
    organizationOptions,
    skillOptions,
    userOptions,
}: CreateQuizPageContentProps) {
    const queryClient = useQueryClient();
    const router = useRouter();
    const isEditing = Boolean(initialQuiz);
    const isDraft = !initialQuiz || initialQuiz.status === CONTENT_STATUS.draft;
    const returnHref = initialQuiz ? `/evaluations/${initialQuiz.id}` : "/evaluations";
    const contextualReturnHref = useContextualReturnHref(returnHref);
    const [form, setForm] = useState<QuizFormState>(() =>
        quizToFormState(initialQuiz, groupOptions, userOptions),
    );
    const [formError, setFormError] = useState<string | null>(null);
    const [savingStatus, setSavingStatus] = useState<ContentStatus | null>(null);
    const [uploadProgressByClientFileId, setUploadProgressByClientFileId] = useState<Record<string, number>>({});
    const [tagDraft, setTagDraft] = useState("");
    const quizSkillOptions = useMemo(
        () => skillOptions.filter(hasActiveQuizKnowledgeItem),
        [skillOptions],
    );
    const competenceOptions: SearchableOption[] = useMemo(
        () =>
            quizSkillOptions.map((skill) => ({
                group: skill.domain || "Compétences",
                label: skill.name,
                value: skill.id,
            })),
        [quizSkillOptions],
    );

    const methodSelectOptions = [
        { label: "Aucune", value: "" },
        ...methodOptions.map(toMethodSelectOption),
    ];
    const selectedMethod = methodOptions.find((method) => method.id === form.methodId) ?? null;
    const methodGeneratedStepCount = form.steps.filter((step) => step.methodStepId !== null).length;
    const organizationSelectOptions = organizationOptions.map((organization) => ({
        label: organization.name,
        value: organization.id,
    }));
    const groupSelectOptions = form.organizationId
        ? groupOptions
              .filter((group) => group.organizationId === form.organizationId)
              .map((group) => ({ label: group.name, value: group.id }))
        : [];
    const userSelectOptions = form.groupId
        ? userOptions
              .filter((user) => user.groupIds.includes(form.groupId))
              .map((user) => ({ label: user.name, value: user.id }))
        : [];

    const totalQuestions = useMemo(
        () => form.steps.reduce((total, step) => total + step.questions.length, 0),
        [form.steps],
    );
    const totalWeight = useMemo(
        () => form.steps.reduce((total, step) => total + integerFromText(step.weight, 0), 0),
        [form.steps],
    );

    const isPrivate = form.scope !== "public";
    const scopeTargetReady =
        form.scope === "public" ||
        (form.scope === "organization" && Boolean(form.organizationId)) ||
        (form.scope === "group" && Boolean(form.organizationId) && Boolean(form.groupId.trim())) ||
        (form.scope === "user" && Boolean(form.assignedUserId.trim()));
    const canSaveDraft = form.title.trim().length > 0;
    const canPublish =
        canSaveDraft &&
        scopeTargetReady &&
        form.description.trim().length > 0 &&
        form.steps.length > 0 &&
        totalQuestions > 0;
    const isSaving = savingStatus !== null;

    function patch<K extends keyof QuizFormState>(key: K, value: QuizFormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function updateStep(stepId: string, updater: (step: QuizStepFormState) => QuizStepFormState) {
        patch(
            "steps",
            form.steps.map((step) => (step.id === stepId ? updater(step) : step)),
        );
    }

    function updateQuestion(
        stepId: string,
        questionId: string,
        updater: (question: QuizQuestionFormState) => QuizQuestionFormState,
    ) {
        updateStep(stepId, (step) => ({
            ...step,
            questions: step.questions.map((question) =>
                question.id === questionId ? updater(question) : question,
            ),
        }));
    }

    function addStep() {
        patch("steps", [...form.steps, emptyStep()]);
    }

    function removeStep(stepId: string) {
        patch("steps", form.steps.filter((step) => step.id !== stepId));
    }

    function addQuestion(stepId: string) {
        updateStep(stepId, (step) => ({
            ...step,
            collapsed: false,
            questions: [...step.questions, emptyQuestion()],
        }));
    }

    function removeQuestion(stepId: string, questionId: string) {
        updateStep(stepId, (step) => ({
            ...step,
            questions: step.questions.filter((question) => question.id !== questionId),
        }));
    }

    function updateChoice(
        stepId: string,
        questionId: string,
        choiceId: string,
        patchChoice: Partial<QuizChoiceFormState>,
    ) {
        updateQuestion(stepId, questionId, (question) => ({
            ...question,
            choices: question.choices.map((choice) =>
                choice.id === choiceId
                    ? {
                          ...choice,
                          ...patchChoice,
                      }
                    : question.type === "QCU" && patchChoice.isCorrect
                      ? {
                            ...choice,
                            isCorrect: false,
                        }
                      : choice,
            ),
        }));
    }

    function setQuestionType(stepId: string, questionId: string, type: QuizQuestionType) {
        updateQuestion(stepId, questionId, (question) => ({
            ...question,
            choices: normalizeChoicesForQuestionType(question.choices, type),
            type,
        }));
    }

    function setAttachmentDeliveryType(
        stepId: string,
        questionId: string,
        attachmentId: string,
        deliveryType: QuizAttachmentDeliveryType,
    ) {
        updateQuestion(stepId, questionId, (question) => ({
            ...question,
            attachments: question.attachments.map((attachment) =>
                attachment.id === attachmentId
                    ? {
                          ...attachment,
                          deliveryType,
                          ...(deliveryType === "url"
                              ? {
                                    clientFileId: "",
                                    file: null,
                                    storageBucket: "",
                                    storagePath: "",
                                    uploadedFileName: "",
                                    uploadedFileSizeBytes: null,
                                }
                              : {
                                    externalUrl: "",
                                    type: attachment.type === "link" ? "document" : attachment.type,
                                }),
                      }
                    : attachment,
            ),
        }));
    }

    function updateAttachmentFromUpload(
        stepId: string,
        questionId: string,
        attachmentId: string,
        file: File,
    ) {
        updateQuestion(stepId, questionId, (question) => ({
            ...question,
            attachments: question.attachments.map((attachment) =>
                attachment.id === attachmentId
                    ? {
                          ...attachment,
                          clientFileId: createClientFileId("quiz-attachment"),
                          deliveryType: "file",
                          externalUrl: "",
                          file,
                          label: attachment.label || file.name,
                          storageBucket: "",
                          storagePath: "",
                          type: inferQuizAttachmentType(file.type),
                          uploadedFileName: file.name,
                          uploadedFileSizeBytes: file.size,
                      }
                    : attachment,
            ),
        }));
    }

    function clearAttachmentUpload(stepId: string, questionId: string, attachmentId: string) {
        updateQuestion(stepId, questionId, (question) => ({
            ...question,
            attachments: question.attachments.map((attachment) =>
                attachment.id === attachmentId
                    ? {
                          ...attachment,
                          clientFileId: "",
                          file: null,
                          storageBucket: "",
                          storagePath: "",
                          uploadedFileName: "",
                          uploadedFileSizeBytes: null,
                      }
                    : attachment,
            ),
        }));
    }

    function addTag() {
        const value = tagDraft.trim();
        if (!value || form.tags.includes(value)) {
            setTagDraft("");
            return;
        }
        patch("tags", [...form.tags, value]);
        setTagDraft("");
    }

    function selectOrganization(value: string) {
        setForm((current) => ({
            ...current,
            assignedUserId: "",
            groupId: "",
            organizationId: value || null,
            scope: value ? "organization" : "public",
        }));
    }

    function selectGroup(value: string) {
        setForm((current) => ({
            ...current,
            assignedUserId: "",
            groupId: value,
            scope: value ? "group" : "organization",
        }));
    }

    function selectUser(value: string) {
        setForm((current) => ({
            ...current,
            assignedUserId: value,
            scope: value ? "user" : "group",
        }));
    }

    function selectMethod(value: string) {
        const methodId = value || null;
        const selectedMethod = methodOptions.find((method) => method.id === methodId);

        setForm((current) => ({
            ...current,
            methodId,
            steps: selectedMethod
                ? createQuizStepsFromMethod(selectedMethod)
                : current.steps.map((step) => ({
                      ...step,
                      methodStepId: null,
                  })),
        }));
    }

    function collectUploadFiles(): QuizUploadFile[] {
        return form.steps.flatMap((step) =>
            step.questions.flatMap((question) =>
                question.attachments.flatMap((attachment) =>
                    attachment.file && attachment.clientFileId
                        ? [{
                              clientFileId: attachment.clientFileId,
                              file: attachment.file,
                              purpose: CONTENT_UPLOAD_PURPOSES.quizAttachment,
                          }]
                        : [],
                ),
            ),
        );
    }

    async function handleSave(status: ContentStatus) {
        if (isSaving || (status === CONTENT_STATUS.published ? !canPublish : !canSaveDraft)) return;

        setFormError(null);
        setSavingStatus(status);
        setUploadProgressByClientFileId({});

        try {
            const savedQuiz = await submitWithDirectUploads({
                onProgress: (clientFileId, percentage) =>
                    setUploadProgressByClientFileId((current) => ({ ...current, [clientFileId]: percentage })),
                payload: toSaveQuizInput(form, status),
                save: (payload) => saveQuiz(initialQuiz?.id, payload),
                uploads: collectUploadFiles(),
            });
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            notifyFormSubmitSuccess();
            router.push(
                buildPostSaveHref(`/evaluations/${savedQuiz.id}`, contextualReturnHref, isEditing),
            );
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer le quiz."));
        } finally {
            setSavingStatus(null);
            setUploadProgressByClientFileId({});
        }
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[900px]">
                <Box className="mb-6 flex items-center gap-4">
                    <ContextualBackLink
                        fallbackHref={returnHref}
                        aria-label="Retour"
                        className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-white",
                            uiTokens.text.heading,
                        )}
                    >
                        <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                    </ContextualBackLink>
                    <Text as="h1" className={cn("text-[28px] font-extrabold leading-tight", uiTokens.text.heading)}>
                        {isEditing ? "Modifier le quiz" : "Créer un quiz"}
                    </Text>
                </Box>

                <Box className="space-y-6">
                    {formError && <AlertMessage message={formError} />}

                    <CardSurface className={uiTokens.surface.formCard}>
                        <SectionHeading title="Informations générales" />
                        <Box className="mt-6 space-y-5">
                            <Box>
                                <FieldLabel required className={uiTokens.form.label}>Titre du quiz</FieldLabel>
                                <TextInput
                                    value={form.title}
                                    onChange={(event) => patch("title", event.target.value)}
                                    placeholder="Ex: Quiz - DEEPMARK"
                                    hasLeadingIcon={false}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Type de quiz</FieldLabel>
                                <SingleSelectField
                                    options={QUIZ_TYPES.map((type) => ({
                                        label: QUIZ_TYPE_LABELS[type],
                                        value: type,
                                    }))}
                                    value={form.quizType}
                                    placeholder="Sélectionner un type"
                                    onChange={(value) => patch("quizType", value as QuizType)}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Domaines</FieldLabel>
                                <SingleSelectField
                                    options={domainOptions}
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
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Méthode associée</FieldLabel>
                                <SingleSelectField
                                    options={methodSelectOptions}
                                    value={form.methodId ?? ""}
                                    placeholder="Aucune"
                                    onChange={selectMethod}
                                />
                                {selectedMethod && methodGeneratedStepCount > 0 && (
                                    <Text
                                        className={cn(
                                            "mt-2 flex items-center gap-1.5 text-[13px] font-semibold",
                                            uiTokens.text.primary,
                                        )}
                                    >
                                        <InlineIcon icon={Sparkles} className="h-4 w-4" />
                                        {methodGeneratedStepCount} étape{methodGeneratedStepCount > 1 ? "s" : ""} →{" "}
                                        {methodGeneratedStepCount} catégorie{methodGeneratedStepCount > 1 ? "s" : ""}{" "}
                                        auto-générée{methodGeneratedStepCount > 1 ? "s" : ""}
                                    </Text>
                                )}
                            </Box>
                            <Box>
                                <FieldLabel required className={uiTokens.form.label}>Description</FieldLabel>
                                <TextArea
                                    value={form.description}
                                    onChange={(event) => patch("description", event.target.value)}
                                    placeholder="Décrivez l'objectif du quiz et les critères attendus."
                                    rows={4}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Durée estimée (en minutes)</FieldLabel>
                                <TextInput
                                    type="number"
                                    min={1}
                                    value={form.durationMinutes}
                                    onChange={(event) => patch("durationMinutes", event.target.value)}
                                    placeholder="30"
                                    hasLeadingIcon={false}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Seuil recommandé de validation</FieldLabel>
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={form.validationThreshold}
                                    onChange={(event) => patch("validationThreshold", event.target.value)}
                                    placeholder="70"
                                    hasLeadingIcon={false}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Nombre de tentatives</FieldLabel>
                                <SegmentedControl
                                    ariaLabel="Limite du nombre de tentatives"
                                    options={attemptLimitOptions}
                                    value={form.maxAttempts === null ? "unlimited" : "limited"}
                                    onChange={(value) =>
                                        patch(
                                            "maxAttempts",
                                            value === "unlimited"
                                                ? null
                                                : form.maxAttempts ?? DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE,
                                        )
                                    }
                                />
                                {form.maxAttempts === null ? (
                                    <Text className={cn("mt-2 text-[13px] font-medium", uiTokens.text.muted)}>
                                        L’apprenant pourra recommencer ce quiz autant de fois qu’il le souhaite.
                                    </Text>
                                ) : (
                                    <Box className="mt-3">
                                        <FieldLabel required className={uiTokens.form.label}>Maximum autorisé</FieldLabel>
                                        <TextInput
                                            type="number"
                                            min={1}
                                            value={form.maxAttempts}
                                            onChange={(event) => patch("maxAttempts", event.target.value)}
                                            placeholder={DEFAULT_QUIZ_MAX_ATTEMPTS_FORM_VALUE}
                                            hasLeadingIcon={false}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Tags</FieldLabel>
                                <Box className="flex gap-2">
                                    <TextInput
                                        value={tagDraft}
                                        onChange={(event) => setTagDraft(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                event.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        placeholder="Ajouter un tag..."
                                        hasLeadingIcon={false}
                                    />
                                    <Button
                                        aria-label="Ajouter le tag"
                                        onClick={addTag}
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]"
                                    >
                                        <InlineIcon icon={Plus} className="h-5 w-5" />
                                    </Button>
                                </Box>
                                {form.tags.length > 0 && (
                                    <Box className="mt-3 flex flex-wrap gap-2">
                                        {form.tags.map((tag) => (
                                            <Box
                                                key={tag}
                                                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] pl-3 pr-1.5 text-[12px] font-bold text-[#374151]"
                                            >
                                                <Text as="span">{tag}</Text>
                                                <Button
                                                    aria-label={`Retirer ${tag}`}
                                                    onClick={() =>
                                                        patch(
                                                            "tags",
                                                            form.tags.filter((item) => item !== tag),
                                                        )
                                                    }
                                                    className="flex h-5 w-5 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-white hover:text-[#111827]"
                                                >
                                                    <InlineIcon icon={X} className="h-3.5 w-3.5" />
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Participation</FieldLabel>
                                <SingleSelectField
                                    options={QUIZ_PARTICIPATIONS.map((participation) => ({
                                        label: QUIZ_PARTICIPATION_LABELS[participation],
                                        value: participation,
                                    }))}
                                    value={form.participation}
                                    placeholder="Sélectionner"
                                    onChange={(value) => patch("participation", value as QuizParticipation)}
                                />
                            </Box>
                            <Box>
                                <FieldLabel className={uiTokens.form.label}>Visibilité</FieldLabel>
                                <Box className="space-y-2.5">
                                    <VisibilityRadio
                                        selected={!isPrivate}
                                        title="Public"
                                        description="Visible par tous les utilisateurs de la plateforme"
                                        onSelect={() => patch("scope", "public")}
                                    />
                                    <VisibilityRadio
                                        selected={isPrivate}
                                        title="Privé"
                                        description="Visible uniquement par une cible spécifique"
                                        onSelect={() => {
                                            if (!isPrivate) patch("scope", "organization");
                                        }}
                                    />
                                </Box>
                                {isPrivate && (
                                    <Box className="mt-3 space-y-4">
                                        <Box>
                                            <FieldLabel required={!isDraft} className={uiTokens.form.label}>Organisation</FieldLabel>
                                            {isDraft && (
                                                <Text className={cn("mb-2 text-[12px] font-medium", uiTokens.text.muted)}>
                                                    Facultatif en brouillon, requis pour publier.
                                                </Text>
                                            )}
                                            <SingleSelectField
                                                options={organizationSelectOptions}
                                                value={form.organizationId}
                                                placeholder="Sélectionner une organisation..."
                                                onChange={selectOrganization}
                                            />
                                        </Box>
                                        {form.organizationId && (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.label}>Groupe</FieldLabel>
                                                <SingleSelectField
                                                    options={[
                                                        { label: "Toute l'organisation", value: "" },
                                                        ...groupSelectOptions,
                                                    ]}
                                                    value={form.groupId}
                                                    placeholder="Toute l'organisation"
                                                    onChange={selectGroup}
                                                />
                                            </Box>
                                        )}
                                        {form.groupId && (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.label}>Utilisateur</FieldLabel>
                                                <SingleSelectField
                                                    options={[
                                                        { label: "Tout le groupe", value: "" },
                                                        ...userSelectOptions,
                                                    ]}
                                                    value={form.assignedUserId}
                                                    placeholder="Tout le groupe"
                                                    onChange={selectUser}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Box>
                        <Box className={uiTokens.surface.divider} />

                        <Box className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <Box>
                                <SectionHeading title="Étapes, compétences & questions" />
                                <Box className="mt-2 flex flex-wrap items-center gap-2">
                                    <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                                        Total : {totalQuestions} question{totalQuestions > 1 ? "s" : ""} réparti
                                        {totalQuestions > 1 ? "es" : "e"} en {form.steps.length} étape
                                        {form.steps.length > 1 ? "s" : ""}
                                    </Text>
                                    {form.steps.length > 0 && (
                                        <Box
                                            className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold",
                                                totalWeight === 100
                                                    ? "bg-[#ECFDF5] text-[#059669]"
                                                    : "bg-[#FFF7ED] text-[#C2410C]",
                                            )}
                                        >
                                            Pondération : {totalWeight}%
                                            {totalWeight !== 100 ? " (manque 100%)" : ""}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                            <Button onClick={addStep} className={cn(uiTokens.action.addButton, "shrink-0")}>
                                <InlineIcon icon={Plus} className="h-4 w-4" />
                                Ajouter une étape
                            </Button>
                        </Box>

                        {form.steps.length === 0 ? (
                            <Box className="mt-6 rounded-[16px] border border-dashed border-[#E5E7EB] py-12 text-center">
                                <Text className={cn("text-[15px] font-bold", uiTokens.text.heading)}>
                                    Aucune catégorie créée
                                </Text>
                                <Text className={cn("mt-1 text-[13px]", uiTokens.text.muted)}>
                                    Cliquez sur « Ajouter une étape » pour commencer
                                </Text>
                            </Box>
                        ) : (
                            <Box className="mt-6 space-y-4">
                                {form.steps.map((step, stepIndex) => {
                                    const competenceCount = step.competenceIds.length;
                                    const questionCount = step.questions.length;
                                    const isFromMethod = step.methodStepId !== null;

                                    return (
                                        <CardSurface key={step.id} className={uiTokens.surface.stepCard}>
                                            <Box className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                                <Box className="flex-1 space-y-1.5">
                                                    {isFromMethod && (
                                                        <Text className={cn("text-[12px] font-bold", uiTokens.text.primary)}>
                                                            Étape {stepIndex + 1} · {selectedMethod ? getMethodSelectionLabel(selectedMethod) : ""}
                                                        </Text>
                                                    )}
                                                    <TextInput
                                                        value={step.name}
                                                        onChange={(event) =>
                                                            updateStep(step.id, (current) => ({
                                                                ...current,
                                                                name: event.target.value,
                                                            }))
                                                        }
                                                        placeholder="Nom de la catégorie..."
                                                        hasLeadingIcon={false}
                                                        readOnly={isFromMethod}
                                                        className={
                                                            isFromMethod
                                                                ? uiTokens.form.controlReadonly
                                                                : uiTokens.form.controlWhite
                                                        }
                                                    />
                                                    <Text className={cn("text-[12px] font-semibold", uiTokens.text.muted)}>
                                                        {questionCount} question{questionCount > 1 ? "s" : ""} ·{" "}
                                                        {competenceCount} compétence{competenceCount > 1 ? "s" : ""}
                                                    </Text>
                                                </Box>
                                                <Box className="flex items-end gap-3">
                                                    <Box>
                                                        <FieldLabel className={uiTokens.form.subLabel}>
                                                            Pondération
                                                        </FieldLabel>
                                                        <Box className="flex items-center gap-1.5">
                                                            <TextInput
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                value={step.weight}
                                                                onChange={(event) =>
                                                                    updateStep(step.id, (current) => ({
                                                                        ...current,
                                                                        weight: event.target.value,
                                                                    }))
                                                                }
                                                                placeholder="0"
                                                                hasLeadingIcon={false}
                                                                className={cn(uiTokens.form.controlWhite, "w-[72px]")}
                                                            />
                                                            <Text className={cn("text-[14px] font-semibold", uiTokens.text.muted)}>
                                                                %
                                                            </Text>
                                                        </Box>
                                                    </Box>
                                                    <Box className="flex items-center gap-1 pb-0.5">
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
                                                        <Button
                                                            aria-label="Supprimer l'étape"
                                                            onClick={() => removeStep(step.id)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                                                        >
                                                            <InlineIcon icon={Trash2} className="h-4 w-4" />
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {!step.collapsed && (
                                                <>
                                                    <Box className="mt-4">
                                                        <FieldLabel required className={uiTokens.form.subLabel}>
                                                            Compétences évaluées dans cette étape
                                                        </FieldLabel>
                                                        <SearchableMultiSelectField
                                                            options={competenceOptions}
                                                            selectedValues={step.competenceIds}
                                                            addButtonClassName={uiTokens.action.addDashed}
                                                            addLabel="Ajouter une compétence"
                                                            searchPlaceholder="Rechercher une compétence..."
                                                            emptyHint="Aucune compétence trouvée"
                                                            onAdd={(value) =>
                                                                updateStep(step.id, (current) => ({
                                                                    ...current,
                                                                    competenceIds: [...current.competenceIds, value],
                                                                }))
                                                            }
                                                            onRemove={(value) =>
                                                                updateStep(step.id, (current) => ({
                                                                    ...current,
                                                                    competenceIds: current.competenceIds.filter(
                                                                        (id) => id !== value,
                                                                    ),
                                                                }))
                                                            }
                                                        />
                                                    </Box>

                                                    <Box className="mt-5 space-y-4">
                                                        {step.questions.map((question, questionIndex) => (
                                                            <QuizQuestionEditor
                                                                key={question.id}
                                                                question={question}
                                                                questionIndex={questionIndex}
                                                                uploadProgressByClientFileId={uploadProgressByClientFileId}
                                                                removable={step.questions.length > 1}
                                                                skillOptions={quizSkillOptions}
                                                                stepCompetenceIds={step.competenceIds}
                                                                onRemove={() => removeQuestion(step.id, question.id)}
                                                                onPatch={(patchQuestion) =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        ...patchQuestion,
                                                                    }))
                                                                }
                                                                onQuestionTypeChange={(type) =>
                                                                    setQuestionType(step.id, question.id, type)
                                                                }
                                                                onChoicePatch={(choiceId, patchChoice) =>
                                                                    updateChoice(step.id, question.id, choiceId, patchChoice)
                                                                }
                                                                onAddChoice={() =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        choices: [...current.choices, emptyChoice()],
                                                                    }))
                                                                }
                                                                onRemoveChoice={(choiceId) =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        choices: normalizeChoicesForQuestionType(
                                                                            current.choices.filter(
                                                                                (choice) => choice.id !== choiceId,
                                                                            ),
                                                                            current.type,
                                                                        ),
                                                                    }))
                                                                }
                                                                onAddAttachment={(type) =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        attachments: [
                                                                            ...current.attachments,
                                                                            emptyAttachment(type),
                                                                        ],
                                                                    }))
                                                                }
                                                                onAttachmentPatch={(attachmentId, patchAttachment) =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        attachments: current.attachments.map((attachment) =>
                                                                            attachment.id === attachmentId
                                                                                ? { ...attachment, ...patchAttachment }
                                                                                : attachment,
                                                                        ),
                                                                    }))
                                                                }
                                                                onAttachmentDeliveryTypeChange={(attachmentId, deliveryType) =>
                                                                    setAttachmentDeliveryType(
                                                                        step.id,
                                                                        question.id,
                                                                        attachmentId,
                                                                        deliveryType,
                                                                    )
                                                                }
                                                                onAttachmentFileSelected={(attachmentId, file) =>
                                                                    updateAttachmentFromUpload(
                                                                        step.id,
                                                                        question.id,
                                                                        attachmentId,
                                                                        file,
                                                                    )
                                                                }
                                                                onAttachmentUploadClear={(attachmentId) =>
                                                                    clearAttachmentUpload(step.id, question.id, attachmentId)
                                                                }
                                                                onError={setFormError}
                                                                onRemoveAttachment={(attachmentId) =>
                                                                    updateQuestion(step.id, question.id, (current) => ({
                                                                        ...current,
                                                                        attachments: current.attachments.filter(
                                                                            (attachment) => attachment.id !== attachmentId,
                                                                        ),
                                                                    }))
                                                                }
                                                            />
                                                        ))}
                                                        <Button
                                                            onClick={() => addQuestion(step.id)}
                                                            className={cn(uiTokens.action.addButton, "w-full justify-center")}
                                                        >
                                                            <InlineIcon icon={Plus} className="h-4 w-4" />
                                                            Ajouter une question
                                                        </Button>
                                                    </Box>
                                                </>
                                            )}
                                        </CardSurface>
                                    );
                                })}
                            </Box>
                        )}
                    </CardSurface>

                    <Box className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        {isDraft && (
                            <Button
                                disabled={!canSaveDraft || isSaving}
                                onClick={() => void handleSave(CONTENT_STATUS.draft)}
                                className={cn(uiTokens.action.secondaryButton, "disabled:cursor-not-allowed disabled:opacity-60")}
                            >
                                {savingStatus === CONTENT_STATUS.draft
                                    ? "Enregistrement..."
                                    : "Enregistrer en brouillon"}
                            </Button>
                        )}
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
                            {savingStatus === CONTENT_STATUS.published
                                ? "Enregistrement..."
                                : isDraft
                                  ? "Publier le quiz"
                                  : "Enregistrer les modifications"}
                        </Button>
                    </Box>
                </Box>
            </Box>
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
            className={cn(
                uiTokens.radio.option,
                selected ? uiTokens.radio.optionSelected : uiTokens.radio.optionIdle,
            )}
        >
            <Box
                className={cn(
                    uiTokens.radio.ring,
                    selected ? uiTokens.radio.ringSelected : uiTokens.radio.ringIdle,
                )}
            >
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
