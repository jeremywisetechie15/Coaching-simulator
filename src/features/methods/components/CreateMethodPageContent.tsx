"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, FileUp, LockKeyhole, Plus, X } from "lucide-react";
import { useState } from "react";
import { ContextualBackLink, useContextualReturnHref } from "@/features/app-shell/components";
import { buildPostSaveHref } from "@/features/app-shell/domain";
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
    CONTENT_DOMAINS,
    CONTENT_STATUS,
    CONTENT_VISIBILITY_CHOICE,
    CONTENT_VISIBILITY_CHOICE_DESCRIPTIONS,
    CONTENT_VISIBILITY_CHOICE_LABELS,
    CONTENT_VISIBILITY_CHOICES,
    getCategoriesForDomain,
    getEntitySelectionLabel,
    isContentCategoryForDomain,
    isContentDomain,
    type ContentCategory,
    type ContentDomain,
    type ContentStatus,
    type ContentVisibilityChoice,
} from "@/features/content/domain";
import { QUIZ_KIND, type QuizOption } from "@/features/evaluations/domain";
import {
    DEFAULT_METHOD_STEP_ICON,
    type MethodDetail,
    type MethodEditorDetail,
    METHOD_ROUTES,
    METHOD_SCOPE,
    METHOD_USAGE_EDIT_RESTRICTION_MESSAGE,
    normalizeMethodStepIcon,
    type MethodOrganizationOption,
    type MethodResource,
    type MethodResourceType,
    type MethodStepIcon,
} from "@/features/methods/domain/method";
import type { SaveMethodInput } from "@/features/methods/dto/save-method.dto";
import {
    buildMethodJsonPrefillPrompt,
    parseMethodJsonPrefillText,
} from "@/features/methods/domain/method-json-prefill";
import { getMethodKnowledgeQuizOptions } from "@/features/methods/domain/method-quiz-selection";
import {
    CONTENT_RESOURCE_DELIVERY_OPTIONS,
    type ContentResourceDeliveryType,
    CONTENT_UPLOAD_PURPOSES,
    inferContentUploadResourceType,
    getStoragePathFileName,
} from "@/lib/uploads/content-upload";
import { submitWithDirectUploads } from "@/lib/uploads/direct-upload.client";
import type { PendingDirectUpload } from "@/lib/uploads/direct-upload";
import { Box, Button, CardSurface, FieldErrorMessage, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    createFormSubmitError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import {
    AlertMessage,
    EditableTextListField,
    FileUploadField,
    SingleSelectField,
    StatusMessage,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { validateMethodFormPayload } from "./method-form-validation";
import { METHOD_STEP_ICON_OPTIONS } from "./method-step-icon.catalog";

const mediaTypeOptions = ["URL (YouTube, Vimeo…)", "Téléchargement"];
const noQuizOptionValue = "__no_quiz__";

const labelClasses = uiTokens.form.label;
const inputClasses = uiTokens.form.control;
const textareaClasses = uiTokens.form.textArea;
type MethodResourceDeliveryType = ContentResourceDeliveryType;

interface MethodStepFormState {
    code: string;
    extraResources: MethodResource[];
    id?: string;
    title: string;
    description: string;
    shortName: string;
    shortDescription: string;
    stepKey: string;
    videoClientFileId: string;
    videoFile: File | null;
    videoResourceId?: string;
    videoResourceType: MethodResourceType;
    videoTitle: string;
    mediaType: string;
    videoUrl: string;
    videoStorageBucket: string;
    videoStoragePath: string;
    videoUploadedFileName: string;
    videoUploadedFileSizeBytes: number | null;
    icon: MethodStepIcon;
    objectifs: string[];
    bonnesPratiques: string[];
    erreurs: string[];
    posture: string[];
    verbatims: string[];
}

interface MethodResourceFormState {
    clientFileId: string;
    deliveryType: MethodResourceDeliveryType;
    externalUrl: string;
    file: File | null;
    id?: string;
    label: string;
    resourceType: MethodResourceType;
    storageBucket: string;
    storagePath: string;
    uploadedFileName: string;
    uploadedFileSizeBytes: number | null;
}

interface ApiErrorPayload {
    code?: string;
    error?: string;
    issues?: Array<{ message: string }>;
    method?: MethodDetail;
}

type MethodUploadFile = PendingDirectUpload;

interface CreateMethodPageContentProps {
    embedded?: boolean;
    initialMethod?: MethodDetail & Partial<Pick<MethodEditorDetail, "hasUsage">>;
    onSaved?: (method: MethodDetail) => void;
    organizationOptions: MethodOrganizationOption[];
    quizOptions: QuizOption[];
}

function createClientFileId(prefix: string) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

async function saveMethod(
    methodId: string | undefined,
    values: SaveMethodInput,
) {
    const response = await fetch(methodId ? METHOD_ROUTES.api.detail(methodId) : METHOD_ROUTES.api.collection, {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: methodId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer la méthode.",
        );
    }

    if (!payload?.method) {
        throw new Error("La méthode a été enregistrée mais la réponse est incomplète.");
    }

    return payload.method;
}

async function duplicateMethod(methodId: string) {
    const response = await fetch(METHOD_ROUTES.api.duplicate(methodId), {
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible de dupliquer la méthode.",
        );
    }

    if (!payload?.method) {
        throw new Error("La méthode a été dupliquée mais la réponse est incomplète.");
    }

    return payload.method;
}

function emptyStep(): MethodStepFormState {
    return {
        code: "",
        title: "",
        description: "",
        extraResources: [],
        shortName: "",
        shortDescription: "",
        stepKey: "",
        videoClientFileId: "",
        videoFile: null,
        videoResourceType: "video",
        videoTitle: "",
        mediaType: mediaTypeOptions[0],
        videoUrl: "",
        videoStorageBucket: "",
        videoStoragePath: "",
        videoUploadedFileName: "",
        videoUploadedFileSizeBytes: null,
        icon: DEFAULT_METHOD_STEP_ICON,
        objectifs: [""],
        bonnesPratiques: [""],
        erreurs: [""],
        posture: [""],
        verbatims: [""],
    };
}

function editableList(items: string[]) {
    return items.length > 0 ? items : [""];
}

function emptyMethodResource(): MethodResourceFormState {
    return {
        clientFileId: "",
        deliveryType: "file",
        externalUrl: "",
        file: null,
        label: "",
        resourceType: "document",
        storageBucket: "",
        storagePath: "",
        uploadedFileName: "",
        uploadedFileSizeBytes: null,
    };
}

function methodResourceToFormState(resource: MethodResource): MethodResourceFormState {
    return {
        clientFileId: "",
        deliveryType: resource.storagePath ? "file" : resource.externalUrl ? "url" : "file",
        externalUrl: resource.externalUrl,
        file: null,
        id: resource.id,
        label: resource.label,
        resourceType: resource.resourceType,
        storageBucket: resource.storageBucket ?? "",
        storagePath: resource.storagePath ?? "",
        uploadedFileName: resource.storagePath ? resource.label || getStoragePathFileName(resource.storagePath) : "",
        uploadedFileSizeBytes: null,
    };
}

function toResourceInput(resource: MethodResource) {
    return {
        externalUrl: resource.externalUrl,
        id: resource.id,
        label: resource.label || resource.externalUrl || resource.storagePath || "",
        resourceType: resource.resourceType,
        storageBucket: resource.storageBucket ?? "",
        storagePath: resource.storagePath ?? "",
    };
}

function methodResourceFormToInput(resource: MethodResourceFormState) {
    const isUrlResource = resource.deliveryType === "url";
    const hasSelectedFile = Boolean(resource.file && resource.clientFileId);

    return {
        clientFileId: !isUrlResource && hasSelectedFile ? resource.clientFileId : "",
        externalUrl: isUrlResource ? resource.externalUrl : "",
        id: resource.id,
        label: resource.label || resource.externalUrl || resource.file?.name || resource.uploadedFileName || resource.storagePath,
        resourceType: isUrlResource
            ? "link"
            : resource.file
                ? inferContentUploadResourceType(resource.file.type)
                : resource.resourceType,
        storageBucket: isUrlResource || hasSelectedFile ? "" : resource.storageBucket,
        storagePath: isUrlResource || hasSelectedFile ? "" : resource.storagePath,
    };
}

function methodResourceHasLocation(resource: MethodResourceFormState) {
    if (resource.deliveryType === "url") {
        return resource.externalUrl.trim().length > 0;
    }

    return (
        Boolean(resource.file && resource.clientFileId) ||
        (resource.storageBucket.trim().length > 0 &&
            resource.storagePath.trim().length > 0)
    );
}

function uploadedFilePreview(resource: MethodResourceFormState) {
    if (resource.file) {
        return {
            fileName: resource.file.name,
            sizeBytes: resource.file.size,
        };
    }

    if (!resource.storageBucket || !resource.storagePath) return null;

    return {
        fileName: resource.uploadedFileName || resource.label || getStoragePathFileName(resource.storagePath),
        sizeBytes: resource.uploadedFileSizeBytes,
    };
}

function stepLearningUploadPreview(step: MethodStepFormState) {
    if (step.videoFile) {
        return {
            fileName: step.videoFile.name,
            sizeBytes: step.videoFile.size,
        };
    }

    if (!step.videoStorageBucket || !step.videoStoragePath) return null;

    return {
        fileName: step.videoUploadedFileName || step.videoTitle || getStoragePathFileName(step.videoStoragePath),
        sizeBytes: step.videoUploadedFileSizeBytes,
    };
}

function methodStepToFormState(step: MethodDetail["steps"][number]): MethodStepFormState {
    const learningResource = step.resources.find((resource) =>
        ["audio", "document", "image", "video"].includes(resource.resourceType),
    );

    return {
        bonnesPratiques: editableList(step.bestPractices),
        code: step.code,
        description: step.summary,
        erreurs: editableList(step.pitfalls),
        extraResources: step.resources.filter((resource) => resource.id !== learningResource?.id),
        icon: step.icon,
        id: step.id,
        objectifs: editableList(step.objectives),
        posture: editableList(step.posture),
        shortDescription: step.takeaway,
        shortName: step.shortTitle,
        stepKey: step.stepKey,
        title: step.title,
        verbatims: editableList(step.verbatims),
        videoClientFileId: "",
        videoFile: null,
        videoResourceId: learningResource?.id,
        videoResourceType: learningResource?.resourceType ?? "video",
        videoTitle: learningResource?.label ?? "",
        videoUrl: learningResource?.externalUrl ?? "",
        mediaType: learningResource?.storagePath ? mediaTypeOptions[1] : mediaTypeOptions[0],
        videoStorageBucket: learningResource?.storageBucket ?? "",
        videoStoragePath: learningResource?.storagePath ?? "",
        videoUploadedFileName: learningResource?.storagePath
            ? learningResource.label || getStoragePathFileName(learningResource.storagePath)
            : "",
        videoUploadedFileSizeBytes: null,
    };
}

function stepLearningResourceToInput(step: MethodStepFormState) {
    if (step.mediaType === mediaTypeOptions[1]) {
        if (step.videoFile && step.videoClientFileId) {
            return [
                {
                    clientFileId: step.videoClientFileId,
                    externalUrl: "",
                    id: step.videoResourceId,
                    label: step.videoTitle || step.videoFile.name,
                    resourceType: inferContentUploadResourceType(step.videoFile.type),
                    storageBucket: "",
                    storagePath: "",
                },
            ];
        }

        if (!step.videoStorageBucket || !step.videoStoragePath) {
            return [];
        }

        return [
            {
                clientFileId: "",
                externalUrl: "",
                id: step.videoResourceId,
                label: step.videoTitle || step.videoUploadedFileName || step.videoStoragePath,
                resourceType: step.videoResourceType,
                storageBucket: step.videoStorageBucket,
                storagePath: step.videoStoragePath,
            },
        ];
    }

    if (step.videoUrl.trim().length === 0) {
        return [];
    }

    return [
        {
            clientFileId: "",
            externalUrl: step.videoUrl,
            id: step.videoResourceId,
            label: step.videoTitle || step.videoUrl,
            resourceType: "video" as const,
            storageBucket: "",
            storagePath: "",
        },
    ];
}

export function CreateMethodPageContent({
    embedded = false,
    initialMethod,
    onSaved,
    organizationOptions,
    quizOptions,
}: CreateMethodPageContentProps) {
    const router = useRouter();
    const isEditing = Boolean(initialMethod);
    const isDraft = !initialMethod || initialMethod.status === CONTENT_STATUS.draft;
    const hasExistingUsage = initialMethod?.hasUsage ?? false;
    const organizationSelectOptions = organizationOptions.map((organization) => ({
        disabled: organization.isSelectable === false,
        label: getEntitySelectionLabel(organization.name, organization),
        value: organization.id,
    }));
    const availableQuizOptions = getMethodKnowledgeQuizOptions(
        quizOptions,
        initialMethod?.id ?? null,
    );
    const initialQuizId = initialMethod
        ? availableQuizOptions.find(
              (quiz) => quiz.methodId === initialMethod.id && quiz.kind === QUIZ_KIND.methodKnowledge,
          )?.id ?? null
        : null;
    const quizSelectOptions = [
        { label: "Aucun quiz associé", value: noQuizOptionValue },
        ...availableQuizOptions.map((quiz) => ({
            disabled: quiz.isSelectable === false,
            label: getEntitySelectionLabel(
                `${quiz.title}${quiz.questionCount > 0 ? ` (${quiz.questionCount} questions)` : ""}`,
                quiz,
            ),
            value: quiz.id,
        })),
    ];
    const initialDomain = isContentDomain(initialMethod?.domain) ? initialMethod.domain : null;
    const initialCategory = isContentCategoryForDomain(initialDomain, initialMethod?.category)
        ? initialMethod.category
        : null;
    const [name, setName] = useState(initialMethod?.name ?? "");
    const [domain, setDomain] = useState<ContentDomain | null>(initialDomain);
    const [category, setCategory] = useState<ContentCategory | null>(initialCategory);
    const [quiz, setQuiz] = useState<string | null>(initialQuizId);
    const [description, setDescription] = useState(initialMethod?.description ?? "");
    const [readingTime, setReadingTime] = useState(
        initialMethod?.readingTimeMinutes ? String(initialMethod.readingTimeMinutes) : "",
    );
    const [visibility, setVisibility] = useState<ContentVisibilityChoice>(
        initialMethod?.scope === METHOD_SCOPE.organization
            ? CONTENT_VISIBILITY_CHOICE.private
            : CONTENT_VISIBILITY_CHOICE.public,
    );
    const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(
        initialMethod?.organizationId ?? null,
    );
    const [methodResources, setMethodResources] = useState<MethodResourceFormState[]>(
        initialMethod?.resources.length
            ? initialMethod.resources.map(methodResourceToFormState)
            : hasExistingUsage
                ? []
                : [emptyMethodResource()],
    );
    const [objectifs, setObjectifs] = useState<string[]>(editableList(initialMethod?.objectives ?? []));
    const [enjeux, setEnjeux] = useState<string[]>(editableList(initialMethod?.challenges ?? []));
    const [steps, setSteps] = useState<MethodStepFormState[]>(
        initialMethod?.steps.length ? initialMethod.steps.map(methodStepToFormState) : [emptyStep()],
    );
    const [creationModeDialogOpen, setCreationModeDialogOpen] = useState(!isEditing && !embedded);
    const [jsonPrefillDialogOpen, setJsonPrefillDialogOpen] = useState(false);
    const [jsonPrefillFieldErrors, setJsonPrefillFieldErrors] = useState<EntityJsonPrefillFieldErrors>({});
    const [jsonPrefillMessage, setJsonPrefillMessage] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [duplicating, setDuplicating] = useState(false);
    const [savingStatus, setSavingStatus] = useState<ContentStatus | null>(null);
    const [uploadProgressByClientFileId, setUploadProgressByClientFileId] = useState<Record<string, number>>({});

    const isSaving = savingStatus !== null;
    const returnHref = initialMethod
        ? METHOD_ROUTES.app.detail(initialMethod.id)
        : METHOD_ROUTES.app.collection;
    const contextualReturnHref = useContextualReturnHref(returnHref);

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

    function listItemErrors(path: string) {
        return Object.entries(jsonPrefillFieldErrors).reduce<Record<number, string>>((result, [key, message]) => {
            if (!message || !key.startsWith(`${path}.`)) return result;
            const index = Number(key.slice(path.length + 1));
            if (Number.isInteger(index)) result[index] = message;
            return result;
        }, {});
    }

    function selectCreationMode(mode: EntityCreationMode) {
        setCreationModeDialogOpen(false);
        if (mode === ENTITY_CREATION_MODE.json) setJsonPrefillDialogOpen(true);
    }

    async function importMethodJson(file: File) {
        const result = parseMethodJsonPrefillText(await file.text(), {
            organizationOptions,
            quizOptions: availableQuizOptions,
        });
        const draft = result.draft;
        setName(draft.name);
        setDomain(draft.domain);
        setCategory(draft.category);
        setQuiz(draft.quizId);
        setDescription(draft.description);
        setReadingTime(draft.readingTimeMinutes === null ? "" : String(draft.readingTimeMinutes));
        setVisibility(draft.visibility);
        setSelectedOrganizationId(draft.organizationId);
        setMethodResources(draft.resources.map((resource) => ({
            ...emptyMethodResource(),
            deliveryType: "url",
            externalUrl: resource.externalUrl,
            label: resource.label,
            resourceType: "link",
        })));
        setObjectifs(draft.objectives);
        setEnjeux(draft.challenges);
        setSteps(draft.steps.map((step) => ({
            ...emptyStep(),
            bonnesPratiques: step.bestPractices,
            description: step.description,
            erreurs: step.pitfalls,
            icon: step.icon,
            mediaType: mediaTypeOptions[0],
            objectifs: step.objectives,
            posture: step.posture,
            shortDescription: step.shortDescription,
            shortName: step.shortName,
            title: step.title,
            verbatims: step.verbatims,
            videoTitle: step.learningResource?.label ?? "",
            videoUrl: step.learningResource?.externalUrl ?? "",
        })));
        setJsonPrefillFieldErrors(result.fieldErrors);
        setJsonPrefillMessage(
            Object.keys(result.fieldErrors).length > 0
                ? "Le fichier a été appliqué. Corrigez les champs signalés avant d’enregistrer."
                : "Le fichier JSON a correctement prérempli la méthode.",
        );
        setFormError(null);
    }

    function updateList(
        list: string[],
        setter: (next: string[]) => void,
        index: number,
        value: string,
    ) {
        setter(list.map((item, itemIndex) => (itemIndex === index ? value : item)));
    }

    function updateStep(stepIndex: number, patch: Partial<MethodStepFormState>) {
        const fieldByFormKey: Partial<Record<keyof MethodStepFormState, string>> = {
            bonnesPratiques: "bestPractices",
            description: "description",
            erreurs: "pitfalls",
            icon: "icon",
            objectifs: "objectives",
            posture: "posture",
            shortDescription: "shortDescription",
            shortName: "shortName",
            title: "title",
            verbatims: "verbatims",
            videoTitle: "learningResource.title",
            videoUrl: "learningResource.externalUrl",
        };
        Object.keys(patch).forEach((key) => {
            const field = fieldByFormKey[key as keyof MethodStepFormState];
            if (field) {
                clearJsonPrefillError(`steps.${stepIndex}.${field}`, true);
                if (field.startsWith("learningResource.")) {
                    clearJsonPrefillError(`steps.${stepIndex}.learningResource`);
                }
            }
        });
        setSteps((current) =>
            current.map((step, index) => (index === stepIndex ? { ...step, ...patch } : step)),
        );
    }

    function updateStepMediaType(stepIndex: number, mediaType: string) {
        updateStep(stepIndex, {
            mediaType,
            ...(mediaType === mediaTypeOptions[0]
                ? {
                      videoClientFileId: "",
                      videoFile: null,
                      videoResourceType: "video",
                      videoStorageBucket: "",
                      videoStoragePath: "",
                      videoUploadedFileName: "",
                      videoUploadedFileSizeBytes: null,
                  }
                : {
                      videoUrl: "",
                  }),
        });
    }

    function updateStepLearningFromUpload(stepIndex: number, file: File) {
        updateStep(stepIndex, {
            mediaType: mediaTypeOptions[1],
            videoClientFileId: createClientFileId(`step-${stepIndex + 1}`),
            videoFile: file,
            videoResourceType: inferContentUploadResourceType(file.type),
            videoStorageBucket: "",
            videoStoragePath: "",
            videoTitle: steps[stepIndex]?.videoTitle || file.name,
            videoUploadedFileName: file.name,
            videoUploadedFileSizeBytes: file.size,
            videoUrl: "",
        });
    }

    function clearStepLearningUpload(stepIndex: number) {
        updateStep(stepIndex, {
            videoClientFileId: "",
            videoFile: null,
            videoResourceType: "video",
            videoStorageBucket: "",
            videoStoragePath: "",
            videoUploadedFileName: "",
            videoUploadedFileSizeBytes: null,
        });
    }

    function updateMethodResource(resourceIndex: number, patch: Partial<MethodResourceFormState>) {
        if (Object.hasOwn(patch, "label")) clearJsonPrefillError(`resources.${resourceIndex}.label`);
        if (Object.hasOwn(patch, "externalUrl")) clearJsonPrefillError(`resources.${resourceIndex}.externalUrl`);
        setMethodResources((current) =>
            current.map((resource, index) => (index === resourceIndex ? { ...resource, ...patch } : resource)),
        );
    }

    function updateMethodResourceDeliveryType(
        resourceIndex: number,
        deliveryType: MethodResourceDeliveryType,
    ) {
        updateMethodResource(resourceIndex, {
            deliveryType,
            ...(deliveryType === "url"
                ? {
                      clientFileId: "",
                      file: null,
                      resourceType: "link",
                      storageBucket: "",
                      storagePath: "",
                      uploadedFileName: "",
                      uploadedFileSizeBytes: null,
                  }
                : {
                      externalUrl: "",
                      resourceType: "document",
                  }),
        });
    }

    function updateMethodResourceFromUpload(resourceIndex: number, file: File) {
        setMethodResources((current) =>
            current.map((resource, index) =>
                index === resourceIndex
                    ? {
                          ...resource,
                          clientFileId: createClientFileId(`resource-${resourceIndex + 1}`),
                          deliveryType: "file",
                          externalUrl: "",
                          file,
                          label: resource.label || file.name,
                          resourceType: inferContentUploadResourceType(file.type),
                          storageBucket: "",
                          storagePath: "",
                          uploadedFileName: file.name,
                          uploadedFileSizeBytes: file.size,
                      }
                    : resource,
            ),
        );
    }

    function clearMethodResourceUpload(resourceIndex: number) {
        updateMethodResource(resourceIndex, {
            clientFileId: "",
            file: null,
            storageBucket: "",
            storagePath: "",
            uploadedFileName: "",
            uploadedFileSizeBytes: null,
        });
    }

    function updateStepList(
        stepIndex: number,
        key: keyof Pick<
            MethodStepFormState,
            "objectifs" | "bonnesPratiques" | "erreurs" | "posture" | "verbatims"
        >,
        next: string[],
    ) {
        updateStep(stepIndex, { [key]: next });
    }

    function buildPayload(status: ContentStatus): SaveMethodInput {
        const parsedReadingTime = readingTime.trim().length > 0 ? Number(readingTime) : null;
        const scope =
            visibility === CONTENT_VISIBILITY_CHOICE.private ? METHOD_SCOPE.organization : METHOD_SCOPE.public;
        const methodResourceInputs = methodResources
            .filter(methodResourceHasLocation)
            .map(methodResourceFormToInput);

        return {
            category: category ?? "",
            challenges: enjeux,
            description,
            domain: domain ?? "",
            name,
            organizationId: scope === METHOD_SCOPE.organization ? selectedOrganizationId : null,
            objectives: objectifs,
            quizId: quiz,
            readingTimeMinutes: Number.isFinite(parsedReadingTime) ? parsedReadingTime : null,
            resources: methodResourceInputs,
            scope,
            status,
            steps: steps.map((step) => ({
                bestPractices: step.bonnesPratiques,
                code: step.code,
                id: step.id,
                icon: step.icon,
                objectives: step.objectifs,
                pitfalls: step.erreurs,
                posture: step.posture,
                resources: [
                    ...stepLearningResourceToInput(step),
                    ...step.extraResources.map(toResourceInput),
                ],
                shortTitle: step.shortName,
                stepKey: step.stepKey,
                summary: step.description,
                takeaway: step.shortDescription,
                title: step.title,
                verbatims: step.verbatims,
            })),
            subtitle: initialMethod?.subtitle ?? "",
            tag: initialMethod?.tag ?? "",
        };
    }

    function collectUploadFiles(): MethodUploadFile[] {
        return [
            ...methodResources.flatMap((resource) =>
                resource.file && resource.clientFileId
                    ? [{
                          clientFileId: resource.clientFileId,
                          file: resource.file,
                          purpose: CONTENT_UPLOAD_PURPOSES.methodDocument,
                      }]
                    : [],
            ),
            ...steps.flatMap((step) =>
                step.videoFile && step.videoClientFileId
                    ? [{
                          clientFileId: step.videoClientFileId,
                          file: step.videoFile,
                          purpose: CONTENT_UPLOAD_PURPOSES.contentAsset,
                      }]
                    : [],
            ),
        ];
    }

    async function handleSave(status: ContentStatus) {
        if (isSaving || duplicating || Object.keys(jsonPrefillFieldErrors).length > 0) return;

        setFormError(null);
        const payload = validateMethodFormPayload(buildPayload(status));
        if (!payload.success) {
            const error = createFormSubmitError(payload.message, 400, "VALIDATION_ERROR");
            setFormError(notifyFormSubmitError(error, payload.message));
            return;
        }

        setSavingStatus(status);
        setUploadProgressByClientFileId({});

        try {
            const savedMethod = await submitWithDirectUploads({
                onProgress: (clientFileId, percentage) =>
                    setUploadProgressByClientFileId((current) => ({ ...current, [clientFileId]: percentage })),
                payload: payload.data,
                save: (payload) => saveMethod(initialMethod?.id, payload),
                uploads: collectUploadFiles(),
            });
            notifyFormSubmitSuccess();
            if (onSaved) {
                onSaved(savedMethod);
                return;
            }

            router.push(
                buildPostSaveHref(
                    METHOD_ROUTES.app.detail(savedMethod.id),
                    contextualReturnHref,
                    isEditing,
                ),
            );
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer la méthode."));
        } finally {
            setSavingStatus(null);
            setUploadProgressByClientFileId({});
        }
    }

    async function handleDuplicate() {
        if (!initialMethod || duplicating || isSaving) return;

        setFormError(null);
        setDuplicating(true);
        try {
            const duplicate = await duplicateMethod(initialMethod.id);
            router.push(METHOD_ROUTES.app.edit(duplicate.id));
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de dupliquer la méthode."));
        } finally {
            setDuplicating(false);
        }
    }

    return (
        <Box as={embedded ? "div" : "main"} className={embedded ? "" : "px-5 pb-16 md:px-9 lg:px-12"}>
            <Box className={embedded ? "" : "mx-auto max-w-[1000px]"}>
                {!embedded && (
                    <Box className={uiTokens.jsonPrefill.formHeader}>
                        <Box className="flex items-center gap-4">
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
                            <Text as="h1" className={cn("text-[26px] font-extrabold leading-tight md:text-[30px]", uiTokens.text.heading)}>
                                {isEditing ? "Modifier la méthode" : "Ajouter une méthode"}
                            </Text>
                        </Box>
                        {!isEditing && (
                            <Button onClick={() => setJsonPrefillDialogOpen(true)} className={uiTokens.action.secondaryButton}>
                                <InlineIcon icon={FileUp} className="h-4 w-4" />
                                {ENTITY_CREATION_MODE_LABELS.json}
                            </Button>
                        )}
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
                    {hasExistingUsage && (
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
                                    {METHOD_USAGE_EDIT_RESTRICTION_MESSAGE}
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
                    <Text as="h2" className={cn("text-[20px] font-extrabold", uiTokens.text.heading)}>
                        Informations générales
                    </Text>
                    <Box className="mt-5 space-y-5">
                        <Box>
                            <FieldLabel required className={labelClasses}>Nom de la méthode</FieldLabel>
                            <TextInput
                                aria-invalid={Boolean(jsonPrefillFieldErrors.name)}
                                value={name}
                                onChange={(event) => {
                                    clearJsonPrefillError("name");
                                    setName(event.target.value);
                                }}
                                placeholder="Ex: Méthode DAGO"
                                hasLeadingIcon={false}
                                className={cn(inputClasses, jsonPrefillFieldErrors.name && uiTokens.form.controlError)}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.name} />
                        </Box>
                        <Box className="grid gap-5 sm:grid-cols-2">
                            <Box>
                                <FieldLabel className={labelClasses}>Domaine</FieldLabel>
                                <SingleSelectField
                                    disabled={hasExistingUsage}
                                    hasError={Boolean(jsonPrefillFieldErrors.domain)}
                                    options={[...CONTENT_DOMAINS]}
                                    value={domain}
                                    placeholder="Sélectionner un domaine"
                                    onChange={(value) => {
                                        if (!isContentDomain(value)) return;

                                        setDomain(value);
                                        setCategory(null);
                                        clearJsonPrefillError("domain");
                                    }}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.domain} />
                            </Box>
                            <Box>
                                <FieldLabel className={labelClasses}>Catégorie</FieldLabel>
                                <SingleSelectField
                                    hasError={Boolean(jsonPrefillFieldErrors.category)}
                                    options={[...getCategoriesForDomain(domain)]}
                                    value={category}
                                    placeholder={domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"}
                                    disabled={hasExistingUsage || !domain}
                                    onChange={(value) => {
                                        if (isContentCategoryForDomain(domain, value)) {
                                            setCategory(value);
                                            clearJsonPrefillError("category");
                                        }
                                    }}
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.category} />
                            </Box>
                        </Box>
                        <Box>
                            <FieldLabel className={labelClasses}>
                                Quiz et évaluation associés (optionnel)
                            </FieldLabel>
                            <SingleSelectField
                                disabled={hasExistingUsage}
                                hasError={Boolean(jsonPrefillFieldErrors.quizId)}
                                options={quizSelectOptions}
                                value={quiz ?? noQuizOptionValue}
                                placeholder="Aucun quiz associé"
                                onChange={(value) => {
                                    clearJsonPrefillError("quizId");
                                    setQuiz(value === noQuizOptionValue ? null : value);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.quizId} />
                        </Box>
                        <Box>
                            <FieldLabel className={labelClasses}>Description</FieldLabel>
                            <TextArea
                                aria-invalid={Boolean(jsonPrefillFieldErrors.description)}
                                value={description}
                                onChange={(event) => {
                                    clearJsonPrefillError("description");
                                    setDescription(event.target.value);
                                }}
                                placeholder="Décrivez brièvement la méthode..."
                                rows={3}
                                className={cn("min-h-[88px]", textareaClasses, jsonPrefillFieldErrors.description && uiTokens.form.controlError)}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.description} />
                        </Box>
                        <Box>
                            <FieldLabel className={labelClasses}>Temps de lecture (en minutes)</FieldLabel>
                            <TextInput
                                aria-invalid={Boolean(jsonPrefillFieldErrors.readingTimeMinutes)}
                                type="number"
                                min={1}
                                value={readingTime}
                                onChange={(event) => {
                                    clearJsonPrefillError("readingTimeMinutes");
                                    setReadingTime(event.target.value);
                                }}
                                placeholder="Ex: 12"
                                hasLeadingIcon={false}
                                className={cn(inputClasses, jsonPrefillFieldErrors.readingTimeMinutes && uiTokens.form.controlError)}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.readingTimeMinutes} />
                        </Box>
                        <Box>
                            <Box className="flex items-center justify-between">
                                <Text as="span" className={cn("text-[14px] font-bold", uiTokens.text.heading)}>
                                    Ressources complémentaires
                                </Text>
                                <Button
                                    disabled={hasExistingUsage}
                                    onClick={() => {
                                        clearJsonPrefillError("resources");
                                        setMethodResources((current) => [...current, emptyMethodResource()]);
                                    }}
                                    className={cn(
                                        uiTokens.action.addButton,
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    )}
                                >
                                    <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                                    Ajouter un document
                                </Button>
                            </Box>
                            <Box className="mt-3 space-y-3">
                                {methodResources.map((resource, resourceIndex) => (
                                    <Box
                                        key={resource.id ?? resourceIndex}
                                        className={cn("space-y-4", uiTokens.surface.nestedCard)}
                                    >
                                        <Box className="flex items-center justify-between gap-3">
                                            <Text as="span" className={cn("text-[13px] font-extrabold", uiTokens.text.heading)}>
                                                Document {resourceIndex + 1}
                                            </Text>
                                            {methodResources.length > 1 && (
                                                <Button
                                                    aria-label={`Retirer le document ${resourceIndex + 1}`}
                                                    disabled={hasExistingUsage}
                                                    onClick={() =>
                                                        setMethodResources((current) =>
                                                            current.filter((_, index) => index !== resourceIndex),
                                                        )
                                                    }
                                                    className={cn(
                                                        uiTokens.action.iconButtonGhost,
                                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                                    )}
                                                >
                                                    <InlineIcon icon={X} className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </Box>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Nom du document</FieldLabel>
                                            <TextInput
                                                aria-invalid={Boolean(jsonPrefillFieldErrors[`resources.${resourceIndex}.label`])}
                                                value={resource.label}
                                                onChange={(event) =>
                                                    updateMethodResource(resourceIndex, { label: event.target.value })
                                                }
                                                placeholder="Ex: Guide de prospection DAGO"
                                                hasLeadingIcon={false}
                                                className={cn(
                                                    uiTokens.form.controlWhite,
                                                    jsonPrefillFieldErrors[`resources.${resourceIndex}.label`] && uiTokens.form.controlError,
                                                )}
                                            />
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`resources.${resourceIndex}.label`]} />
                                        </Box>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Type de document</FieldLabel>
                                            <SingleSelectField
                                                disabled={hasExistingUsage}
                                                options={[...CONTENT_RESOURCE_DELIVERY_OPTIONS]}
                                                value={resource.deliveryType}
                                                placeholder="Sélectionner un type"
                                                onChange={(value) =>
                                                    updateMethodResourceDeliveryType(
                                                        resourceIndex,
                                                        value as MethodResourceDeliveryType,
                                                    )
                                                }
                                            />
                                        </Box>
                                        {resource.deliveryType === "file" ? (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>Fichier du document</FieldLabel>
                                                <FileUploadField
                                                    disabled={hasExistingUsage}
                                                    inputId={`method-resource-upload-${resourceIndex}`}
                                                    file={uploadedFilePreview(resource)}
                                                    uploadProgress={uploadProgressByClientFileId[resource.clientFileId]}
                                                    uploadPurpose={CONTENT_UPLOAD_PURPOSES.methodDocument}
                                                    onFileSelected={(file) =>
                                                        updateMethodResourceFromUpload(resourceIndex, file)
                                                    }
                                                    onClear={() => clearMethodResourceUpload(resourceIndex)}
                                                    onError={setFormError}
                                                />
                                            </Box>
                                        ) : (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>URL du document</FieldLabel>
                                                <TextInput
                                                    aria-invalid={Boolean(jsonPrefillFieldErrors[`resources.${resourceIndex}.externalUrl`])}
                                                    value={resource.externalUrl}
                                                    onChange={(event) =>
                                                        updateMethodResource(resourceIndex, {
                                                            externalUrl: event.target.value,
                                                        })
                                                    }
                                                    placeholder="https://..."
                                                    hasLeadingIcon={false}
                                                    className={cn(
                                                        uiTokens.form.controlWhite,
                                                        jsonPrefillFieldErrors[`resources.${resourceIndex}.externalUrl`] && uiTokens.form.controlError,
                                                    )}
                                                />
                                                <FieldErrorMessage message={jsonPrefillFieldErrors[`resources.${resourceIndex}.externalUrl`]} />
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                            <FieldErrorMessage message={jsonPrefillFieldErrors.resources} />
                        </Box>
                    </Box>

                    <Box className={uiTokens.surface.divider} />

                    <Text as="h2" className={cn("text-[20px] font-extrabold", uiTokens.text.heading)}>
                        Visibilité
                    </Text>
                    <Text className={cn("mt-2 text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                        Les méthodes publiques sont visibles par toutes les organisations. Les méthodes privées sont
                        limitées à l&apos;organisation sélectionnée.
                    </Text>
                    <Box className="mt-4 space-y-3">
                        {CONTENT_VISIBILITY_CHOICES.map((option) => {
                            const isSelected = visibility === option;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    role="radio"
                                    aria-checked={isSelected}
                                    disabled={hasExistingUsage}
                                    onClick={() => {
                                        setVisibility(option);
                                        clearJsonPrefillError("visibility");
                                        if (option === CONTENT_VISIBILITY_CHOICE.public) {
                                            setSelectedOrganizationId(null);
                                            clearJsonPrefillError("organizationId");
                                        }
                                    }}
                                    className={cn(
                                        uiTokens.radio.option,
                                        isSelected ? uiTokens.radio.optionSelected : uiTokens.radio.optionIdle,
                                        hasExistingUsage && "cursor-not-allowed opacity-60",
                                    )}
                                >
                                    <Box
                                        className={cn(
                                            uiTokens.radio.ring,
                                            isSelected ? uiTokens.radio.ringSelected : uiTokens.radio.ringIdle,
                                        )}
                                    >
                                        {isSelected && <Box className={uiTokens.radio.dot} />}
                                    </Box>
                                    <Text as="span" className={cn("text-[14px] font-bold", uiTokens.text.heading)}>
                                        {CONTENT_VISIBILITY_CHOICE_LABELS[option]}
                                    </Text>
                                    <Text as="span" className={cn("text-[13px] font-medium", uiTokens.text.muted)}>
                                        — {CONTENT_VISIBILITY_CHOICE_DESCRIPTIONS[option]}
                                    </Text>
                                </button>
                            );
                        })}
                    </Box>
                    <FieldErrorMessage message={jsonPrefillFieldErrors.visibility} />

                    {visibility === CONTENT_VISIBILITY_CHOICE.private && (
                        <CardSurface className={cn("mt-4", uiTokens.surface.nestedCard)}>
                            <FieldLabel required className={uiTokens.form.subLabel}>Organisation propriétaire</FieldLabel>
                            <SingleSelectField
                                hasError={Boolean(jsonPrefillFieldErrors.organizationId)}
                                options={organizationSelectOptions}
                                value={selectedOrganizationId}
                                placeholder={
                                    organizationSelectOptions.length > 0
                                        ? "Sélectionner une organisation..."
                                        : "Aucune organisation disponible"
                                }
                                disabled={hasExistingUsage || organizationSelectOptions.length === 0}
                                onChange={(value) => {
                                    clearJsonPrefillError("organizationId");
                                    setSelectedOrganizationId(value);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.organizationId} />
                        </CardSurface>
                    )}

                    <Box className={uiTokens.surface.divider} />

                    <Text as="h2" className={cn("text-[20px] font-extrabold", uiTokens.text.heading)}>
                        Objectifs et Enjeux
                    </Text>
                    <Box className="mt-5 space-y-5">
                        <EditableTextListField
                            error={jsonPrefillFieldErrors.objectives}
                            itemErrors={listItemErrors("objectives")}
                            label="Objectifs"
                            placeholder="Ex: Obtenir un rendez-vous qualifié avec le décideur"
                            items={objectifs}
                            showAddLabel
                            structureLocked={hasExistingUsage}
                            onAdd={() => setObjectifs((current) => [...current, ""])}
                            onChange={(index, value) => {
                                clearJsonPrefillError(`objectives.${index}`);
                                clearJsonPrefillError("objectives");
                                updateList(objectifs, setObjectifs, index, value);
                            }}
                            onRemove={(index) =>
                                setObjectifs((current) => current.filter((_, i) => i !== index))
                            }
                        />
                        <EditableTextListField
                            error={jsonPrefillFieldErrors.challenges}
                            itemErrors={listItemErrors("challenges")}
                            label="Enjeux"
                            placeholder="Ex: Éviter le refus catégorique du standard"
                            items={enjeux}
                            showAddLabel
                            structureLocked={hasExistingUsage}
                            onAdd={() => setEnjeux((current) => [...current, ""])}
                            onChange={(index, value) => {
                                clearJsonPrefillError(`challenges.${index}`);
                                clearJsonPrefillError("challenges");
                                updateList(enjeux, setEnjeux, index, value);
                            }}
                            onRemove={(index) => setEnjeux((current) => current.filter((_, i) => i !== index))}
                        />
                    </Box>

                    <Box className={uiTokens.surface.divider} />

                    <Box className="flex items-center justify-between">
                        <Text as="h2" className={cn("text-[20px] font-extrabold", uiTokens.text.heading)}>
                            Étapes de la méthode
                        </Text>
                        <Button
                            disabled={hasExistingUsage}
                            onClick={() => {
                                clearJsonPrefillError("steps");
                                setSteps((current) => [...current, emptyStep()]);
                            }}
                            className={cn(
                                uiTokens.action.addButton,
                                "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                        >
                            <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                            Ajouter une étape
                        </Button>
                    </Box>
                    <FieldErrorMessage message={jsonPrefillFieldErrors.steps} />

                    <Box className="mt-4 space-y-5">
                        {steps.map((step, stepIndex) => (
                            <CardSurface
                                key={stepIndex}
                                className={uiTokens.surface.stepCard}
                            >
                                <Box className="flex items-center justify-between">
                                    <Text as="h3" className={cn("text-[15px] font-extrabold", uiTokens.text.heading)}>
                                        Étape {stepIndex + 1}
                                    </Text>
                                    {steps.length > 1 && (
                                        <Button
                                            aria-label={`Retirer l'étape ${stepIndex + 1}`}
                                            disabled={hasExistingUsage}
                                            onClick={() =>
                                                {
                                                    clearJsonPrefillError("steps");
                                                    setSteps((current) =>
                                                        current.filter((_, i) => i !== stepIndex),
                                                    );
                                                }
                                            }
                                            className={cn(
                                                uiTokens.action.stepRemoveButton,
                                                "disabled:cursor-not-allowed disabled:opacity-50",
                                            )}
                                        >
                                            <InlineIcon icon={X} className="h-4 w-4" />
                                        </Button>
                                    )}
                                </Box>

                                <Box className="mt-4 space-y-4">
                                    <Box>
                                        <FieldLabel required className={uiTokens.form.subLabel}>Titre de l&apos;étape</FieldLabel>
                                        <TextInput
                                            aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.title`])}
                                            value={step.title}
                                            onChange={(event) =>
                                                updateStep(stepIndex, { title: event.target.value })
                                            }
                                            placeholder="Ex: Démarrer l'appel et passer le barrage du standard"
                                            hasLeadingIcon={false}
                                            className={cn(
                                                uiTokens.form.controlWhite,
                                                jsonPrefillFieldErrors[`steps.${stepIndex}.title`] && uiTokens.form.controlError,
                                            )}
                                        />
                                        <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.title`]} />
                                    </Box>
                                    <Box>
                                        <FieldLabel className={uiTokens.form.subLabel}>Description</FieldLabel>
                                        <TextArea
                                            aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.description`])}
                                            value={step.description}
                                            onChange={(event) =>
                                                updateStep(stepIndex, { description: event.target.value })
                                            }
                                            placeholder="Décrivez cette étape..."
                                            rows={2}
                                            className={cn(
                                                uiTokens.form.textAreaWhite,
                                                jsonPrefillFieldErrors[`steps.${stepIndex}.description`] && uiTokens.form.controlError,
                                            )}
                                        />
                                        <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.description`]} />
                                    </Box>

                                    <Box className={uiTokens.surface.quickTakeCard}>
                                        <Text as="span" className={cn("block text-[12px] font-extrabold uppercase tracking-[0.08em]", uiTokens.text.quickTake)}>
                                            À retenir en 30 secondes
                                        </Text>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Nom court de l&apos;étape</FieldLabel>
                                            <TextInput
                                                aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.shortName`])}
                                                value={step.shortName}
                                                onChange={(event) =>
                                                    updateStep(stepIndex, { shortName: event.target.value })
                                                }
                                                placeholder="Ex: Démarrer"
                                                hasLeadingIcon={false}
                                                className={cn(
                                                    uiTokens.form.controlWhite,
                                                    jsonPrefillFieldErrors[`steps.${stepIndex}.shortName`] && uiTokens.form.controlError,
                                                )}
                                            />
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.shortName`]} />
                                        </Box>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Description courte</FieldLabel>
                                            <TextInput
                                                aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.shortDescription`])}
                                                value={step.shortDescription}
                                                onChange={(event) =>
                                                    updateStep(stepIndex, { shortDescription: event.target.value })
                                                }
                                                placeholder="Ex: Passer le barrage du standard"
                                                hasLeadingIcon={false}
                                                className={cn(
                                                    uiTokens.form.controlWhite,
                                                    jsonPrefillFieldErrors[`steps.${stepIndex}.shortDescription`] && uiTokens.form.controlError,
                                                )}
                                            />
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.shortDescription`]} />
                                        </Box>
                                    </Box>

                                    <Box className={uiTokens.surface.learningCard}>
                                        <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource`]} />
                                        <Text as="span" className={cn("block text-[12px] font-extrabold uppercase tracking-[0.08em]", uiTokens.text.learning)}>
                                            Capsule e-learning
                                        </Text>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Titre du média</FieldLabel>
                                            <TextInput
                                                aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.title`])}
                                                value={step.videoTitle}
                                                onChange={(event) =>
                                                    updateStep(stepIndex, { videoTitle: event.target.value })
                                                }
                                                placeholder="Ex: Méthode DAGO: Démarrer l'appel"
                                                hasLeadingIcon={false}
                                                className={cn(
                                                    uiTokens.form.controlWhite,
                                                    jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.title`] && uiTokens.form.controlError,
                                                )}
                                            />
                                            <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.title`]} />
                                        </Box>
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Type de média</FieldLabel>
                                            <SingleSelectField
                                                disabled={hasExistingUsage}
                                                options={mediaTypeOptions}
                                                value={step.mediaType}
                                                placeholder="Sélectionner un type de média"
                                                onChange={(value) => updateStepMediaType(stepIndex, value)}
                                            />
                                        </Box>
                                        {step.mediaType === mediaTypeOptions[1] ? (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>Fichier du média</FieldLabel>
                                                <FileUploadField
                                                    disabled={hasExistingUsage}
                                                    inputId={`method-step-learning-upload-${stepIndex}`}
                                                    file={stepLearningUploadPreview(step)}
                                                    uploadProgress={uploadProgressByClientFileId[step.videoClientFileId]}
                                                    onFileSelected={(file) =>
                                                        updateStepLearningFromUpload(stepIndex, file)
                                                    }
                                                    onClear={() => clearStepLearningUpload(stepIndex)}
                                                    onError={setFormError}
                                                />
                                            </Box>
                                        ) : (
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>URL de la vidéo</FieldLabel>
                                                <TextInput
                                                    aria-invalid={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.externalUrl`])}
                                                    value={step.videoUrl}
                                                    onChange={(event) =>
                                                        updateStep(stepIndex, { videoUrl: event.target.value })
                                                    }
                                                    placeholder="https://youtu.be/..."
                                                    hasLeadingIcon={false}
                                                    className={cn(
                                                        uiTokens.form.controlWhite,
                                                        jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.externalUrl`] && uiTokens.form.controlError,
                                                    )}
                                                />
                                                <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.learningResource.externalUrl`]} />
                                            </Box>
                                        )}
                                    </Box>

                                    <Box>
                                        <FieldLabel className={uiTokens.form.subLabel}>Icône</FieldLabel>
                                        <SingleSelectField
                                            disabled={hasExistingUsage}
                                            hasError={Boolean(jsonPrefillFieldErrors[`steps.${stepIndex}.icon`])}
                                            options={METHOD_STEP_ICON_OPTIONS}
                                            value={step.icon}
                                            placeholder="Sélectionner une icône"
                                            onChange={(value) =>
                                                updateStep(stepIndex, { icon: normalizeMethodStepIcon(value) })
                                            }
                                        />
                                        <FieldErrorMessage message={jsonPrefillFieldErrors[`steps.${stepIndex}.icon`]} />
                                    </Box>

                                    <EditableTextListField
                                        error={jsonPrefillFieldErrors[`steps.${stepIndex}.objectives`]}
                                        itemErrors={listItemErrors(`steps.${stepIndex}.objectives`)}
                                        label="Objectifs de l'étape"
                                        placeholder="Objectif..."
                                        items={step.objectifs}
                                        structureLocked={hasExistingUsage}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "objectifs", [...step.objectifs, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "objectifs",
                                                step.objectifs.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "objectifs",
                                                step.objectifs.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <EditableTextListField
                                        error={jsonPrefillFieldErrors[`steps.${stepIndex}.bestPractices`]}
                                        itemErrors={listItemErrors(`steps.${stepIndex}.bestPractices`)}
                                        label="Bonnes pratiques"
                                        placeholder="Bonne pratique..."
                                        items={step.bonnesPratiques}
                                        structureLocked={hasExistingUsage}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "bonnesPratiques", [
                                                ...step.bonnesPratiques,
                                                "",
                                            ])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "bonnesPratiques",
                                                step.bonnesPratiques.map((it, i) =>
                                                    i === index ? value : it,
                                                ),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "bonnesPratiques",
                                                step.bonnesPratiques.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <EditableTextListField
                                        error={jsonPrefillFieldErrors[`steps.${stepIndex}.pitfalls`]}
                                        itemErrors={listItemErrors(`steps.${stepIndex}.pitfalls`)}
                                        label="Erreurs à éviter"
                                        placeholder="Erreur à éviter..."
                                        items={step.erreurs}
                                        structureLocked={hasExistingUsage}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "erreurs", [...step.erreurs, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "erreurs",
                                                step.erreurs.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "erreurs",
                                                step.erreurs.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <EditableTextListField
                                        error={jsonPrefillFieldErrors[`steps.${stepIndex}.posture`]}
                                        itemErrors={listItemErrors(`steps.${stepIndex}.posture`)}
                                        label="Posture & Communication"
                                        placeholder="Posture..."
                                        items={step.posture}
                                        structureLocked={hasExistingUsage}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "posture", [...step.posture, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "posture",
                                                step.posture.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "posture",
                                                step.posture.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                    <EditableTextListField
                                        error={jsonPrefillFieldErrors[`steps.${stepIndex}.verbatims`]}
                                        itemErrors={listItemErrors(`steps.${stepIndex}.verbatims`)}
                                        label="Verbatims préconisés"
                                        placeholder="Verbatim..."
                                        items={step.verbatims}
                                        structureLocked={hasExistingUsage}
                                        onAdd={() =>
                                            updateStepList(stepIndex, "verbatims", [...step.verbatims, ""])
                                        }
                                        onChange={(index, value) =>
                                            updateStepList(
                                                stepIndex,
                                                "verbatims",
                                                step.verbatims.map((it, i) => (i === index ? value : it)),
                                            )
                                        }
                                        onRemove={(index) =>
                                            updateStepList(
                                                stepIndex,
                                                "verbatims",
                                                step.verbatims.filter((_, i) => i !== index),
                                            )
                                        }
                                    />
                                </Box>
                            </CardSurface>
                        ))}
                    </Box>

                    <Box className={uiTokens.surface.divider} />

                    {formError && (
                        <Box className="mb-5">
                            <AlertMessage message={formError} />
                        </Box>
                    )}
                    <Box className="flex justify-end gap-3">
                        {isDraft && !embedded && (
                            <Button
                                disabled={isSaving || duplicating || Object.keys(jsonPrefillFieldErrors).length > 0}
                                onClick={() => handleSave(CONTENT_STATUS.draft)}
                                className={uiTokens.action.secondaryButton}
                            >
                                {savingStatus === CONTENT_STATUS.draft
                                    ? "Enregistrement..."
                                    : "Enregistrer en brouillon"}
                            </Button>
                        )}
                        <Button
                            disabled={isSaving || duplicating || Object.keys(jsonPrefillFieldErrors).length > 0}
                            onClick={() => handleSave(CONTENT_STATUS.published)}
                            className={cn(
                                "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition",
                                !isSaving && !duplicating && Object.keys(jsonPrefillFieldErrors).length === 0
                                    ? uiTokens.action.primaryButton
                                    : uiTokens.action.primaryButtonDisabled,
                            )}
                        >
                            {savingStatus === CONTENT_STATUS.published
                                ? "Enregistrement..."
                                : isDraft
                                  ? "Publier la méthode"
                                  : "Enregistrer les modifications"}
                        </Button>
                    </Box>
                </CardSurface>
            </Box>

            {creationModeDialogOpen && (
                <EntityCreationModeDialog
                    entityLabel="Méthode"
                    onClose={() => setCreationModeDialogOpen(false)}
                    onSelect={selectCreationMode}
                />
            )}
            {jsonPrefillDialogOpen && (
                <EntityJsonPrefillDialog
                    entityLabel="Méthode"
                    onClose={() => setJsonPrefillDialogOpen(false)}
                    onImport={importMethodJson}
                    prompt={buildMethodJsonPrefillPrompt({
                        organizationOptions,
                        quizOptions: availableQuizOptions,
                    })}
                />
            )}
        </Box>
    );
}
