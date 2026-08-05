"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    Check,
    ChevronDown,
    Copy,
    FileUp,
    LockKeyhole,
    Plus,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ContextualBackLink, useContextualReturnHref } from "@/features/app-shell/components";
import { buildPostSaveHref } from "@/features/app-shell/domain";
import {
    ACTIVITY_SECTORS,
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
    getEntitySelectionLabel,
    isEntitySelectionAvailable,
    type ActivitySectorCode,
} from "@/features/content/domain";
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
    ContentEditorSubmitActions,
    ContentTargetScopeField,
    type ContentTargetScopeValue,
} from "@/features/content/components";
import { CreateCoachPageContent } from "@/features/coaches/components/CreateCoachPageContent";
import type { CoachListItem } from "@/features/coaches/domain/coach-list";
import { QUIZ_PARTICIPATION_LABELS, QUIZ_PARTICIPATIONS, type QuizParticipation } from "@/features/evaluations/domain";
import { CreateMethodPageContent } from "@/features/methods/components/CreateMethodPageContent";
import {
    toMethodSelectOption,
    type MethodDetail as CreatedMethodDetail,
} from "@/features/methods/domain/method";
import { CreatePersonaPageContent } from "@/features/personas/components/CreatePersonaPageContent";
import type { PersonaListItem } from "@/features/personas/domain/persona-list";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";
import type { SaveRoleplayInput } from "@/features/roleplays/dto";
import {
    type RoleplayCoachOption,
    type RoleplayEditorDetail,
    type RoleplayDifficulty,
    type RoleplayGroupOption,
    type RoleplayMethodOption,
    type RoleplayOrganizationOption,
    type RoleplayPersonaOption,
    type RoleplayQuizOption,
    type RoleplayResource,
    type RoleplayScorecardOption,
    type RoleplayUserOption,
    ROLEPLAY_LEARNER_ROLE_MAX_LENGTH,
    ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT,
    ROLEPLAY_ROUTES,
    ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE,
    buildRoleplayJsonPrefillPrompt,
    getAssignableRoleplayQuizOptions,
    getRoleplayMethodKnowledgeQuizOption,
    getRoleplayPublicationIssues,
    parseRoleplayJsonPrefillText,
} from "@/features/roleplays/domain";
import {
    roleplayCategoryOptions,
    roleplayDifficultyOptions,
    roleplayDomainOptions,
} from "@/features/roleplays/data/roleplays";
import {
    CONTENT_RESOURCE_DELIVERY_OPTIONS,
    type ContentResourceDeliveryType,
    CONTENT_UPLOAD_PURPOSES,
    getStoragePathFileName,
    inferContentUploadResourceType,
} from "@/lib/uploads/content-upload";
import type { PendingDirectUpload } from "@/lib/uploads/direct-upload";
import { submitWithDirectUploads } from "@/lib/uploads/direct-upload.client";
import { Box, Button, CardSurface, FieldErrorMessage, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import {
    createFormSubmitApiError,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "@/lib/ui/feedback/form-submit-feedback";
import {
    AlertMessage,
    FileUploadField,
    SessionBackgroundUploadField,
    SingleSelectField,
    StatusMessage,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { RoleplayAiInstructionsField } from "./RoleplayAiInstructionsField";

type EntityEditor = "coach" | "method" | "persona";
type RoleplayResourceDeliveryType = ContentResourceDeliveryType;

interface SelectOption {
    disabled?: boolean;
    label: string;
    value: string;
}

interface RoleplayApiPayload {
    error?: string;
    issues?: Array<{ message: string }>;
    roleplay?: { id: string };
}

type RoleplayUploadFile = PendingDirectUpload;

interface RoleplayResourceFormItem {
    clientFileId: string;
    deliveryType: RoleplayResourceDeliveryType;
    externalUrl: string;
    file: File | null;
    id?: string;
    label: string;
    resourceType: RoleplayResource["resourceType"];
    storageBucket: string;
    storagePath: string;
    uploadedFileName: string;
    uploadedFileSizeBytes: number | null;
}

interface CreateRoleplayPageContentProps {
    coachOptions: RoleplayCoachOption[];
    groupOptions: RoleplayGroupOption[];
    initialRoleplay?: RoleplayEditorDetail;
    methodOptions: RoleplayMethodOption[];
    organizationOptions: RoleplayOrganizationOption[];
    personaOptions: RoleplayPersonaOption[];
    quizOptions: RoleplayQuizOption[];
    roleplayId?: string;
    scorecardOptions: RoleplayScorecardOption[];
    userOptions: RoleplayUserOption[];
}

const staticOptions = (options: string[]): SelectOption[] => options.map((option) => ({ label: option, value: option }));

const fieldLabelClasses = uiTokens.form.label;

function getJsonPrefillError(errors: EntityJsonPrefillFieldErrors, path: string) {
    return errors[path] ?? Object.entries(errors).find(([key]) => key.startsWith(`${path}.`))?.[1];
}

function createClientFileId(prefix: string) {
    return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function emptyRoleplayResource(): RoleplayResourceFormItem {
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

function roleplayResourceToForm(resource: RoleplayResource): RoleplayResourceFormItem {
    return {
        clientFileId: "",
        deliveryType: resource.storagePath ? "file" : resource.externalUrl ? "url" : "file",
        externalUrl: resource.externalUrl ?? "",
        file: null,
        id: resource.id,
        label: resource.label || resource.storagePath || resource.externalUrl || "Ressource",
        resourceType: resource.resourceType,
        storageBucket: resource.storageBucket ?? "",
        storagePath: resource.storagePath ?? "",
        uploadedFileName: resource.storagePath ? resource.label || getStoragePathFileName(resource.storagePath) : "",
        uploadedFileSizeBytes: null,
    };
}

function roleplayResourceToInput(resource: RoleplayResourceFormItem): NonNullable<SaveRoleplayInput["resources"]>[number] {
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

function uploadedResourcePreview(resource: RoleplayResourceFormItem) {
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
                            disabled={option.disabled}
                            key={option.value}
                            onClick={() => {
                                if (option.disabled) return;
                                onChange(option.value);
                                setOpen(false);
                            }}
                            className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg px-3 text-left text-[14px] font-medium transition ${
                                option.disabled
                                    ? "cursor-not-allowed text-[#9CA3AF] opacity-70"
                                    : "hover:bg-[#F6F7FB]"
                            } ${
                                option.value === value && !option.disabled ? "text-[#5140F0]" : "text-[#111827]"
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

function QuizParticipationField({
    disabled = false,
    emptyMessage = "Aucun quiz disponible",
    options,
    placeholder = "Ajouter un quiz d'évaluation...",
    selectedIds,
    participation,
    onToggle,
    onParticipationChange,
}: {
    disabled?: boolean;
    emptyMessage?: string;
    options: RoleplayQuizOption[];
    placeholder?: string;
    selectedIds: string[];
    participation: QuizParticipation;
    onToggle: (id: string) => void;
    onParticipationChange: (value: QuizParticipation) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useOutsideClose(() => setOpen(false));
    const selectedQuizzes = selectedIds
        .map((id) => options.find((option) => option.id === id))
        .filter((option): option is RoleplayQuizOption => Boolean(option));
    const displayedOptions = options.filter(
        (quiz) => isEntitySelectionAvailable(quiz) || selectedIds.includes(quiz.id),
    );

    return (
        <Box>
            <Text as="span" className={fieldLabelClasses}>
                Quiz et évaluations complémentaires{" "}
                <Text as="span" className="font-medium text-[#9CA3AF]">(optionnel)</Text>
            </Text>
            <div ref={ref} className="relative">
                {selectedQuizzes.length > 0 && (
                    <Box className="mb-2.5 flex flex-wrap gap-2">
                        {selectedQuizzes.map((quiz) => (
                            <Box
                                key={quiz.id}
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#EEF0FF] py-1 pl-3 pr-2 text-[13px] font-semibold text-[#5140F0]"
                            >
                                {getEntitySelectionLabel(quiz.title, quiz)}
                                <Button
                                    aria-label={`Retirer ${quiz.title}`}
                                    disabled={disabled}
                                    onClick={() => onToggle(quiz.id)}
                                    className="flex h-5 w-5 items-center justify-center rounded-md text-[#5140F0] transition hover:bg-[#DDE0FF] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <InlineIcon icon={X} className="h-3.5 w-3.5" />
                                </Button>
                            </Box>
                        ))}
                    </Box>
                )}

                <Button
                    disabled={disabled}
                    onClick={() => !disabled && setOpen((current) => !current)}
                    aria-expanded={open}
                    className="flex h-12 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] text-[#9CA3AF] transition hover:border-[#D5D7DE] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <Text as="span">{placeholder}</Text>
                    <InlineIcon
                        icon={ChevronDown}
                        className={`h-4 w-4 text-[#9CA3AF] transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </Button>

                {open && (
                    <CardSurface className="absolute left-0 right-0 top-[56px] z-30 max-h-[280px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]">
                        {displayedOptions.length === 0 ? (
                            <Text className="px-3 py-6 text-center text-[13px] text-[#9CA3AF]">
                                {emptyMessage}
                            </Text>
                        ) : (
                            displayedOptions.map((quiz) => {
                                const isChecked = selectedIds.includes(quiz.id);
                                const canToggle = isEntitySelectionAvailable(quiz) || isChecked;
                                return (
                                    <Button
                                        disabled={!canToggle}
                                        key={quiz.id}
                                        onClick={() => canToggle && onToggle(quiz.id)}
                                        className={cn(
                                            "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition",
                                            canToggle
                                                ? "text-[#111827] hover:bg-[#F6F7FB]"
                                                : "cursor-not-allowed text-[#9CA3AF] opacity-70",
                                        )}
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
                                        <Text as="span" className="flex-1">
                                            {getEntitySelectionLabel(quiz.title, quiz)}
                                        </Text>
                                        <Text as="span" className="text-[12px] font-semibold text-[#9CA3AF]">
                                            {quiz.questionCount} Q
                                        </Text>
                                    </Button>
                                );
                            })
                        )}
                    </CardSurface>
                )}
            </div>

            {selectedQuizzes.length > 0 && (
                <Box className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <Text as="span" className="text-[14px] font-bold text-[#111827]">
                        Participation
                    </Text>
                    {QUIZ_PARTICIPATIONS.map((option) => {
                        const isSelected = participation === option;
                        return (
                            <Button
                                disabled={disabled}
                                key={option}
                                onClick={() => onParticipationChange(option)}
                                aria-pressed={isSelected}
                                className="flex items-center gap-2 text-[14px] font-semibold text-[#374151]"
                            >
                                <Box
                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                                        isSelected ? "border-[#5140F0]" : "border-[#9CA3AF]"
                                    }`}
                                >
                                    {isSelected && <Box className="h-2.5 w-2.5 rounded-full bg-[#5140F0]" />}
                                </Box>
                                {QUIZ_PARTICIPATION_LABELS[option]}
                            </Button>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

function MethodQuizInformationField({ quiz }: { quiz: RoleplayQuizOption | null }) {
    return (
        <Box>
            <FieldLabel className={fieldLabelClasses}>Quiz et évaluations de la méthode</FieldLabel>
            <Box className={uiTokens.form.readonlySelection}>
                <InlineIcon icon={LockKeyhole} className="h-4 w-4 shrink-0 text-[#5140F0]" />
                <Text as="span" className="min-w-0 flex-1 truncate">
                    {quiz
                        ? getEntitySelectionLabel(quiz.title, quiz)
                        : "Aucun quiz associé à cette méthode"}
                </Text>
                {quiz && (
                    <Text as="span" className="shrink-0 text-[12px] font-semibold text-[#6B7280]">
                        {quiz.questionCount} Q
                    </Text>
                )}
            </Box>
        </Box>
    );
}

function PlusButton({
    disabled = false,
    label,
    onClick,
}: {
    disabled?: boolean;
    label: string;
    onClick?: () => void;
}) {
    return (
        <Button
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={onClick}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0] disabled:cursor-not-allowed disabled:opacity-60"
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

async function saveRoleplay(
    roleplayId: string | undefined,
    values: SaveRoleplayInput,
    backgroundFile: File | null,
) {
    const hasFiles = Boolean(backgroundFile);
    const body = hasFiles ? new FormData() : JSON.stringify(values);
    const headers = hasFiles ? undefined : { "Content-Type": "application/json" };

    if (body instanceof FormData) {
        body.append("payload", JSON.stringify(values));
        if (backgroundFile) body.append("backgroundFile", backgroundFile);
    }

    const response = await fetch(roleplayId ? ROLEPLAY_ROUTES.api.detail(roleplayId) : ROLEPLAY_ROUTES.api.collection, {
        body,
        headers,
        method: roleplayId ? "PATCH" : "POST",
    });
    const payload = (await response.json().catch(() => null)) as RoleplayApiPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible d'enregistrer le roleplay.",
        );
    }

    if (!payload?.roleplay) {
        throw new Error("Le roleplay a été enregistré mais la réponse est incomplète.");
    }

    return payload.roleplay;
}

async function duplicateRoleplay(roleplayId: string) {
    const response = await fetch(ROLEPLAY_ROUTES.api.duplicate(roleplayId), {
        method: "POST",
    });
    const payload = (await response.json().catch(() => null)) as RoleplayApiPayload | null;

    if (!response.ok) {
        throw createFormSubmitApiError(
            payload,
            response.status,
            "Impossible de dupliquer le roleplay.",
        );
    }

    if (!payload?.roleplay) {
        throw new Error("Le roleplay a été dupliqué mais la réponse est incomplète.");
    }

    return payload.roleplay;
}

function getInitialTargetScope(
    initialRoleplay: RoleplayEditorDetail | undefined,
    groupOptions: RoleplayGroupOption[],
    userOptions: RoleplayUserOption[],
): ContentTargetScopeValue {
    const scope = initialRoleplay?.scope ?? CONTENT_VISIBILITY_SCOPE.public;

    if (scope === CONTENT_VISIBILITY_SCOPE.public) {
        return {
            assignedUserId: "",
            groupId: "",
            organizationId: null,
            scope,
        };
    }

    const assignedUserId = initialRoleplay?.assignedUserId ?? "";
    let groupId = initialRoleplay?.groupId ?? "";
    let organizationId = initialRoleplay?.organizationId ?? null;

    if (scope === CONTENT_VISIBILITY_SCOPE.user && assignedUserId) {
        const user = userOptions.find((option) => option.id === assignedUserId);
        groupId ||= user?.groupIds[0] ?? "";

        if (!organizationId && groupId) {
            organizationId = groupOptions.find((group) => group.id === groupId)?.organizationId ?? null;
        }

        organizationId ||= user?.organizationIds[0] ?? null;
    }

    if (scope === CONTENT_VISIBILITY_SCOPE.group && groupId && !organizationId) {
        organizationId = groupOptions.find((group) => group.id === groupId)?.organizationId ?? null;
    }

    return {
        assignedUserId: scope === CONTENT_VISIBILITY_SCOPE.user ? assignedUserId : "",
        groupId: scope === CONTENT_VISIBILITY_SCOPE.group || scope === CONTENT_VISIBILITY_SCOPE.user ? groupId : "",
        organizationId,
        scope,
    };
}

export function CreateRoleplayPageContent({
    coachOptions,
    groupOptions,
    initialRoleplay,
    methodOptions,
    organizationOptions,
    personaOptions,
    quizOptions,
    roleplayId,
    scorecardOptions,
    userOptions,
}: CreateRoleplayPageContentProps) {
    const queryClient = useQueryClient();
    const returnHref = roleplayId ? ROLEPLAY_ROUTES.app.detail(roleplayId) : ROLEPLAY_ROUTES.app.collection;
    const isDraft = !initialRoleplay || initialRoleplay.status === CONTENT_STATUS.draft;
    const hasExistingSessions = initialRoleplay?.hasSessions ?? false;
    const router = useRouter();
    const contextualReturnHref = useContextualReturnHref(returnHref);
    const [localPersonaOptions, setLocalPersonaOptions] = useState(personaOptions);
    const [localCoachOptions, setLocalCoachOptions] = useState(coachOptions);
    const [localMethodOptions, setLocalMethodOptions] = useState(methodOptions);
    const [activitySectorCode, setActivitySectorCode] = useState(initialRoleplay?.activitySectorCode ?? null);
    const [persona, setPersona] = useState<string | null>(initialRoleplay?.personaId ?? null);
    const [coach, setCoach] = useState<string | null>(initialRoleplay?.coachId ?? null);
    const [method, setMethod] = useState<string | null>(initialRoleplay?.methodId ?? null);
    const [scorecard, setScorecard] = useState<string | null>(initialRoleplay?.scorecardId ?? null);
    const [quizIds, setQuizIds] = useState<string[]>(initialRoleplay?.quizIds ?? []);
    const [quizParticipation, setQuizParticipation] = useState<QuizParticipation>(
        initialRoleplay?.quizzes[0]?.participation ?? "optional",
    );
    const [domain, setDomain] = useState<string | null>(initialRoleplay?.domain || null);
    const [category, setCategory] = useState<string | null>(initialRoleplay?.category || null);
    const [difficulty, setDifficulty] = useState<string | null>(initialRoleplay?.configuredDifficulty ?? null);
    const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(
        initialRoleplay?.estimatedDurationMinutes === null ||
        initialRoleplay?.estimatedDurationMinutes === undefined
            ? ""
            : String(initialRoleplay.estimatedDurationMinutes),
    );
    const [previewTitle, setPreviewTitle] = useState(initialRoleplay?.previewTitle || initialRoleplay?.title || "");
    const [previewDescription, setPreviewDescription] = useState(
        initialRoleplay?.previewDescription || initialRoleplay?.description || "",
    );
    const [aiInstructions, setAiInstructions] = useState(initialRoleplay?.aiInstructions ?? "");
    const [context, setContext] = useState(initialRoleplay?.context ?? "");
    const [learnerRole, setLearnerRole] = useState(initialRoleplay?.learnerRole ?? "");
    const [objective, setObjective] = useState(initialRoleplay?.objective ?? "");
    const [obstacles, setObstacles] = useState(initialRoleplay?.obstacles ?? "");
    const [validationThreshold, setValidationThreshold] = useState(
        String(initialRoleplay?.validationThreshold ?? ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT),
    );
    const [backgroundImagePath, setBackgroundImagePath] = useState(initialRoleplay?.backgroundImagePath ?? "");
    const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
    const [resources, setResources] = useState<RoleplayResourceFormItem[]>(() =>
        (initialRoleplay?.resources ?? []).map(roleplayResourceToForm),
    );
    const [targetScope, setTargetScope] = useState<ContentTargetScopeValue>(() =>
        getInitialTargetScope(initialRoleplay, groupOptions, userOptions),
    );
    const [openEntityEditor, setOpenEntityEditor] = useState<EntityEditor | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [creationModeDialogOpen, setCreationModeDialogOpen] = useState(!roleplayId);
    const [jsonPrefillDialogOpen, setJsonPrefillDialogOpen] = useState(false);
    const [jsonPrefillFieldErrors, setJsonPrefillFieldErrors] = useState<EntityJsonPrefillFieldErrors>({});
    const [jsonPrefillMessage, setJsonPrefillMessage] = useState<string | null>(null);
    const [duplicating, setDuplicating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadProgressByClientFileId, setUploadProgressByClientFileId] = useState<Record<string, number>>({});

    const personaSelectOptions = useMemo(
        () =>
            localPersonaOptions.map((item) => ({
                disabled: item.isSelectable === false,
                label: getEntitySelectionLabel(
                    [item.name, item.role, item.company].filter(Boolean).join(" - "),
                    item,
                ),
                value: item.id,
            })),
        [localPersonaOptions],
    );
    const coachSelectOptions = useMemo(
        () =>
            localCoachOptions.map((item) => ({
                disabled: item.isSelectable === false,
                label: getEntitySelectionLabel(item.name, item),
                value: item.id,
            })),
        [localCoachOptions],
    );
    const methodSelectOptions = useMemo(
        () => localMethodOptions.map(toMethodSelectOption),
        [localMethodOptions],
    );
    const scorecardSelectOptions = useMemo(
        () =>
            scorecardOptions
                .filter((item) => method && item.methodId === method)
                .map((item) => ({
                    disabled: item.isSelectable === false,
                    label: getEntitySelectionLabel(item.name, item),
                    value: item.id,
                })),
        [method, scorecardOptions],
    );
    const assignableQuizOptions = useMemo(
        () => getAssignableRoleplayQuizOptions(quizOptions, method),
        [method, quizOptions],
    );
    const methodKnowledgeQuiz = useMemo(
        () => getRoleplayMethodKnowledgeQuizOption(quizOptions, method),
        [method, quizOptions],
    );
    const assignableQuizIds = useMemo(
        () => new Set(assignableQuizOptions.map((quiz) => quiz.id)),
        [assignableQuizOptions],
    );
    const activitySectorOptions = useMemo(
        () => [
            { label: "Non renseigné", value: "" },
            ...ACTIVITY_SECTORS.map(({ code, label }) => ({ label, value: code })),
        ],
        [],
    );

    useEffect(() => {
        if (!scorecard) return;

        const scorecardStillMatchesMethod = scorecardOptions.some(
            (option) => option.id === scorecard && option.methodId === method,
        );

        if (!method || !scorecardStillMatchesMethod) {
            setScorecard(null);
        }
    }, [method, scorecard, scorecardOptions]);

    useEffect(() => {
        setQuizIds((current) => current.filter((quizId) => assignableQuizIds.has(quizId)));
    }, [assignableQuizIds]);

    function selectMethod(methodId: string) {
        clearJsonPrefillError("methodId");
        clearJsonPrefillError("scorecardId");
        clearJsonPrefillError("quizIds", true);
        setMethod(methodId);
        setScorecard((current) =>
            scorecardOptions.some((option) => option.id === current && option.methodId === methodId)
                ? current
                : null,
        );
    }

    function toggleQuiz(id: string) {
        if (!assignableQuizIds.has(id)) return;

        clearJsonPrefillError("quizIds", true);

        setQuizIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    function updateResource(resourceIndex: number, patch: Partial<RoleplayResourceFormItem>) {
        clearJsonPrefillError("resources", true);
        setResources((current) =>
            current.map((resource, index) => (index === resourceIndex ? { ...resource, ...patch } : resource)),
        );
    }

    function updateResourceDeliveryType(resourceIndex: number, deliveryType: RoleplayResourceDeliveryType) {
        updateResource(resourceIndex, {
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

    function updateResourceFromUpload(resourceIndex: number, file: File) {
        setResources((current) =>
            current.map((resource, index) =>
                index === resourceIndex
                    ? {
                          ...resource,
                          clientFileId: createClientFileId(`scenario-resource-${resourceIndex + 1}`),
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

    function clearResourceUpload(resourceIndex: number) {
        updateResource(resourceIndex, {
            clientFileId: "",
            file: null,
            storageBucket: "",
            storagePath: "",
            uploadedFileName: "",
            uploadedFileSizeBytes: null,
        });
    }

    function removeResource(resourceIndex: number) {
        clearJsonPrefillError("resources", true);
        setResources((current) => current.filter((_, index) => index !== resourceIndex));
    }

    function collectUploadFiles(): RoleplayUploadFile[] {
        return resources.flatMap((resource) =>
            resource.file && resource.clientFileId
                ? [{
                      clientFileId: resource.clientFileId,
                      file: resource.file,
                      purpose: CONTENT_UPLOAD_PURPOSES.scenarioResource,
                  }]
                : [],
        );
    }

    const canSave = previewTitle.trim().length > 0 && Object.keys(jsonPrefillFieldErrors).length === 0;
    const canPublish = canSave && getRoleplayPublicationIssues({
        assignedUserId: targetScope.assignedUserId,
        category,
        coachId: coach,
        difficulty,
        domain,
        groupId: targetScope.groupId,
        learnerRole,
        methodId: method,
        organizationId: targetScope.organizationId,
        personaId: persona,
        scope: targetScope.scope,
        scorecardId: scorecard,
    }).length === 0;

    function selectCreatedPersona(createdPersona: PersonaListItem) {
        setLocalPersonaOptions((current) =>
            current.some((option) => option.id === createdPersona.id)
                ? current
                : [
                      ...current,
                      {
                          avatarUrl: createdPersona.avatarUrl,
                          company: createdPersona.company,
                          id: createdPersona.id,
                          name: createdPersona.name,
                          role: createdPersona.role,
                      },
                  ],
        );
        setPersona(createdPersona.id);
        setOpenEntityEditor(null);
    }

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

    function selectCreationMode(mode: EntityCreationMode) {
        setCreationModeDialogOpen(false);
        if (mode === ENTITY_CREATION_MODE.json) setJsonPrefillDialogOpen(true);
    }

    async function importRoleplayJson(file: File) {
        const result = parseRoleplayJsonPrefillText(await file.text(), {
            coachOptions: localCoachOptions,
            groupOptions,
            methodOptions: localMethodOptions,
            organizationOptions,
            personaOptions: localPersonaOptions,
            quizOptions,
            scorecardOptions,
            userOptions,
        });
        const draft = result.draft;
        const user = draft.assignedUserId
            ? userOptions.find((option) => option.id === draft.assignedUserId)
            : undefined;
        const derivedGroupId = draft.scope === CONTENT_VISIBILITY_SCOPE.user
            ? user?.groupIds[0] ?? ""
            : draft.groupId ?? "";
        const derivedOrganizationId = draft.scope === CONTENT_VISIBILITY_SCOPE.user
            ? groupOptions.find((group) => group.id === derivedGroupId)?.organizationId ??
              user?.organizationIds[0] ??
              null
            : draft.organizationId;

        setActivitySectorCode(draft.activitySectorCode);
        setAiInstructions(draft.aiInstructions);
        setCategory(draft.category);
        setCoach(draft.coachId);
        setContext(draft.context);
        setDifficulty(draft.difficulty);
        setDomain(draft.domain);
        setEstimatedDurationMinutes(
            draft.estimatedDurationMinutes === null ? "" : String(draft.estimatedDurationMinutes),
        );
        setLearnerRole(draft.learnerRole);
        setMethod(draft.methodId);
        setObjective(draft.objective);
        setObstacles(draft.obstacles);
        setPersona(draft.personaId);
        setPreviewDescription(draft.previewDescription);
        setPreviewTitle(draft.previewTitle);
        setQuizIds(draft.quizIds);
        setQuizParticipation(draft.quizParticipation);
        setResources(draft.resources.map((resource) => ({
            ...emptyRoleplayResource(),
            deliveryType: "url",
            externalUrl: resource.externalUrl,
            label: resource.label || resource.externalUrl,
            resourceType: "link",
        })));
        setScorecard(draft.scorecardId);
        setTargetScope({
            assignedUserId: draft.scope === CONTENT_VISIBILITY_SCOPE.user
                ? draft.assignedUserId ?? ""
                : "",
            groupId:
                draft.scope === CONTENT_VISIBILITY_SCOPE.group ||
                draft.scope === CONTENT_VISIBILITY_SCOPE.user
                    ? derivedGroupId
                    : "",
            organizationId: derivedOrganizationId,
            scope: draft.scope,
        });
        setValidationThreshold(String(draft.validationThreshold));
        setJsonPrefillFieldErrors(result.fieldErrors);
        setJsonPrefillMessage(
            Object.keys(result.fieldErrors).length > 0
                ? "Le fichier a été appliqué. Corrigez les champs signalés avant d’enregistrer."
                : "Le fichier JSON a correctement prérempli le roleplay.",
        );
        setFormError(null);
    }

    function selectCreatedCoach(createdCoach: CoachListItem) {
        setLocalCoachOptions((current) =>
            current.some((option) => option.id === createdCoach.id)
                ? current
                : [
                      ...current,
                      {
                          id: createdCoach.id,
                          name: createdCoach.name,
                      },
                  ],
        );
        setCoach(createdCoach.id);
        setOpenEntityEditor(null);
    }

    function selectCreatedMethod(createdMethod: CreatedMethodDetail) {
        setLocalMethodOptions((current) =>
            current.some((option) => option.id === createdMethod.id)
                ? current
                : [
                      ...current,
                      {
                          id: createdMethod.id,
                          name: createdMethod.name,
                      },
                  ],
        );
        selectMethod(createdMethod.id);
        setOpenEntityEditor(null);
    }

    function toSaveInput(status: SaveRoleplayInput["status"]): SaveRoleplayInput {
        const scope = targetScope.scope;
        const title = previewTitle.trim();
        return {
            activitySectorCode,
            aiInstructions,
            assignedUserId: scope === CONTENT_VISIBILITY_SCOPE.user ? targetScope.assignedUserId : null,
            backgroundImagePath,
            category: category ?? "",
            coachId: coach,
            context,
            description: initialRoleplay?.description || objective || context || title,
            difficulty: difficulty as RoleplayDifficulty | null,
            disc: initialRoleplay?.disc ?? "Stable",
            domain: domain ?? "",
            estimatedDurationMinutes: estimatedDurationMinutes.trim()
                ? Number(estimatedDurationMinutes)
                : null,
            groupId: scope === CONTENT_VISIBILITY_SCOPE.group ? targetScope.groupId : null,
            learnerRole,
            methodId: method,
            objective,
            obstacles,
            organizationId:
                scope === CONTENT_VISIBILITY_SCOPE.organization
                    ? targetScope.organizationId
                    : scope === CONTENT_VISIBILITY_SCOPE.group
                      ? targetScope.organizationId
                      : null,
            personaId: persona,
            previewDescription,
            previewTitle,
            quizIds,
            quizParticipation,
            resources: resources.map(roleplayResourceToInput),
            scope,
            scorecardId: scorecard,
            status,
            title,
            validationThreshold: validationThreshold.trim()
                ? Number(validationThreshold)
                : ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT,
        };
    }

    async function handleSave(status: SaveRoleplayInput["status"]) {
        const canSaveStatus = status === CONTENT_STATUS.published ? canPublish : canSave;
        if (!canSaveStatus || saving) return;

        setFormError(null);
        setSaving(true);
        setUploadProgressByClientFileId({});
        try {
            const saved = await submitWithDirectUploads({
                onProgress: (clientFileId, percentage) =>
                    setUploadProgressByClientFileId((current) => ({ ...current, [clientFileId]: percentage })),
                payload: toSaveInput(status),
                save: (payload) => saveRoleplay(roleplayId, payload, backgroundFile),
                uploads: collectUploadFiles(),
            });
            void queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
            notifyFormSubmitSuccess();
            router.push(
                buildPostSaveHref(
                    ROLEPLAY_ROUTES.app.detail(saved.id),
                    contextualReturnHref,
                    Boolean(roleplayId),
                ),
            );
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible d'enregistrer le roleplay."));
        } finally {
            setSaving(false);
            setUploadProgressByClientFileId({});
        }
    }

    async function handleDuplicate() {
        if (!roleplayId || duplicating || saving) return;

        setFormError(null);
        setDuplicating(true);
        try {
            const duplicate = await duplicateRoleplay(roleplayId);
            router.push(ROLEPLAY_ROUTES.app.edit(duplicate.id));
            router.refresh();
        } catch (error) {
            setFormError(notifyFormSubmitError(error, "Impossible de dupliquer le roleplay."));
        } finally {
            setDuplicating(false);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const status = submitter?.value === "save-draft"
            ? CONTENT_STATUS.draft
            : CONTENT_STATUS.published;
        void handleSave(status);
    }

    return (
        <Box as="main" className="px-5 pb-16 md:px-9 lg:px-12">
            <Box as="form" onSubmit={handleSubmit} className="mx-auto max-w-[1000px]">
                <Box className={cn("mb-6", uiTokens.jsonPrefill.formHeader)}>
                    <Box className="flex items-start gap-4">
                        <ContextualBackLink
                            fallbackHref={returnHref}
                            aria-label="Retour"
                            className="mt-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[#111827] transition hover:bg-white"
                        >
                            <InlineIcon icon={ArrowLeft} className="h-5 w-5" />
                        </ContextualBackLink>
                        <Box>
                            <Text as="h1" className="text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]">
                                {roleplayId ? "Modifier le scénario" : "Créer un scénario"}
                            </Text>
                            <Text className="mt-1.5 text-[15px] font-semibold text-[#596273]">
                                Configurez votre scénario de roleplay personnalisé
                            </Text>
                        </Box>
                    </Box>
                    {!roleplayId && (
                        <Button
                            onClick={() => setJsonPrefillDialogOpen(true)}
                            className={uiTokens.action.secondaryButton}
                        >
                            <InlineIcon icon={FileUp} className="h-4 w-4" />
                            {ENTITY_CREATION_MODE_LABELS.json}
                        </Button>
                    )}
                </Box>

                <CardSurface className="rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9">
                    {formError && <AlertMessage message={formError} />}
                    {jsonPrefillMessage && (
                        <Box className={uiTokens.jsonPrefill.formNotice}>
                            <StatusMessage
                                tone={Object.keys(jsonPrefillFieldErrors).length > 0 ? "info" : "success"}
                                message={jsonPrefillMessage}
                            />
                        </Box>
                    )}
                    {hasExistingSessions && (
                        <Box
                            className={cn(
                                "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                                uiTokens.surface.mutedPanel,
                            )}
                        >
                            <Box className="flex min-w-0 items-start gap-3">
                                <InlineIcon icon={LockKeyhole} className="mt-0.5 h-4 w-4 shrink-0 text-[#5140F0]" />
                                <Text className={cn("text-[13px] font-medium leading-5", uiTokens.text.muted)}>
                                    {ROLEPLAY_SESSION_EDIT_RESTRICTION_MESSAGE}
                                </Text>
                            </Box>
                            <Button
                                disabled={duplicating || saving}
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
                    <Box className={cn("mb-5", uiTokens.surface.mutedPanel)}>
                        <Text className={cn("text-[13px] font-medium", uiTokens.text.muted)}>
                            <span aria-hidden="true" className={uiTokens.text.required}>*</span>{" "}
                            Champs requis pour publier. Seul le titre est requis pour enregistrer un brouillon.
                        </Text>
                    </Box>
                    <Box className="space-y-5">
                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Persona IA</FieldLabel>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        disabled={hasExistingSessions}
                                        options={personaSelectOptions}
                                        value={persona}
                                        placeholder="Sélectionner un persona IA"
                                        onChange={(value) => {
                                            clearJsonPrefillError("personaId");
                                            setPersona(value);
                                        }}
                                    />
                                </Box>
                                <PlusButton
                                    disabled={hasExistingSessions}
                                    label="Créer un nouveau persona"
                                    onClick={() => setOpenEntityEditor("persona")}
                                />
                            </Box>
                            <FieldErrorMessage message={jsonPrefillFieldErrors.personaId} />
                        </Box>

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Coach IA</FieldLabel>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        disabled={hasExistingSessions}
                                        options={coachSelectOptions}
                                        value={coach}
                                        placeholder="Sélectionner un coach IA"
                                        onChange={(value) => {
                                            clearJsonPrefillError("coachId");
                                            setCoach(value);
                                        }}
                                    />
                                </Box>
                                <PlusButton
                                    disabled={hasExistingSessions}
                                    label="Créer un nouveau coach IA"
                                    onClick={() => setOpenEntityEditor("coach")}
                                />
                            </Box>
                            <FieldErrorMessage message={jsonPrefillFieldErrors.coachId} />
                        </Box>
                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box className="space-y-5">
                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Méthodes et Playbooks</FieldLabel>
                            <Box className="flex gap-2.5">
                                <Box className="flex-1">
                                    <SingleSelect
                                        disabled={hasExistingSessions}
                                        options={methodSelectOptions}
                                        value={method}
                                        placeholder="Sélectionner une méthode ou un playbook"
                                        onChange={selectMethod}
                                    />
                                </Box>
                                <PlusButton
                                    disabled={hasExistingSessions}
                                    label="Créer une nouvelle méthode"
                                    onClick={() => setOpenEntityEditor("method")}
                                />
                            </Box>
                            <FieldErrorMessage message={jsonPrefillFieldErrors.methodId} />
                        </Box>

                        {method && <MethodQuizInformationField quiz={methodKnowledgeQuiz} />}

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>
                                Scorecard de la méthode sélectionnée
                            </FieldLabel>
                            <SingleSelectField
                                disabled={
                                    hasExistingSessions ||
                                    !method ||
                                    scorecardSelectOptions.length === 0
                                }
                                options={scorecardSelectOptions}
                                value={scorecard}
                                placeholder={
                                    !method
                                        ? "Sélectionnez d'abord une méthode"
                                        : scorecardSelectOptions.length > 0
                                          ? "Sélectionner une scorecard"
                                          : "Aucune scorecard pour cette méthode"
                                }
                                onChange={(value) => {
                                    clearJsonPrefillError("scorecardId");
                                    setScorecard(value);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.scorecardId} />
                        </Box>

                        <QuizParticipationField
                            disabled={hasExistingSessions || !method}
                            emptyMessage="Aucun quiz complémentaire disponible"
                            options={assignableQuizOptions}
                            placeholder={
                                method ? "Ajouter un quiz d'évaluation..." : "Sélectionnez d'abord une méthode"
                            }
                            selectedIds={quizIds}
                            participation={quizParticipation}
                            onToggle={toggleQuiz}
                            onParticipationChange={(value) => {
                                clearJsonPrefillError("quizParticipation");
                                setQuizParticipation(value);
                            }}
                        />
                        <FieldErrorMessage
                            message={getJsonPrefillError(jsonPrefillFieldErrors, "quizIds") ?? jsonPrefillFieldErrors.quizParticipation}
                        />

                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box className="space-y-5">
                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Domaines</FieldLabel>
                            <SingleSelect
                                disabled={hasExistingSessions}
                                options={staticOptions(roleplayDomainOptions)}
                                value={domain}
                                placeholder="Sélectionner un domaine"
                                onChange={(value) => {
                                    clearJsonPrefillError("domain");
                                    clearJsonPrefillError("category");
                                    setDomain(value);
                                    setCategory(null);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.domain} />
                        </Box>

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Catégorie</FieldLabel>
                            <SingleSelect
                                disabled={hasExistingSessions || !domain}
                                options={staticOptions(roleplayCategoryOptions)}
                                value={category}
                                placeholder={domain ? "Sélectionner une catégorie" : "Sélectionnez d'abord un domaine"}
                                onChange={(value) => {
                                    clearJsonPrefillError("category");
                                    setCategory(value);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.category} />
                        </Box>

                        <Box>
                            <FieldLabel className={fieldLabelClasses}>
                                Secteur d’activité <span className={uiTokens.text.muted}>(optionnel)</span>
                            </FieldLabel>
                            <SingleSelectField
                                disabled={hasExistingSessions}
                                hasError={Boolean(jsonPrefillFieldErrors.activitySectorCode)}
                                options={activitySectorOptions}
                                value={activitySectorCode ?? ""}
                                placeholder="Non renseigné"
                                onChange={(value) => {
                                    clearJsonPrefillError("activitySectorCode");
                                    setActivitySectorCode(value ? value as ActivitySectorCode : null);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.activitySectorCode} />
                        </Box>

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>Niveau de difficulté</FieldLabel>
                            <SingleSelect
                                disabled={hasExistingSessions}
                                options={staticOptions(roleplayDifficultyOptions)}
                                value={difficulty}
                                placeholder="Sélectionnez la difficulté"
                                onChange={(value) => {
                                    clearJsonPrefillError("difficulty");
                                    setDifficulty(value);
                                }}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.difficulty} />
                        </Box>

                        <Box className="grid gap-5 sm:grid-cols-2">
                            <Box>
                                <FieldLabel className={fieldLabelClasses}>
                                    Durée estimée (en minutes)
                                </FieldLabel>
                                <TextInput
                                    type="number"
                                    min={1}
                                    value={estimatedDurationMinutes}
                                    onChange={(event) => {
                                        clearJsonPrefillError("estimatedDurationMinutes");
                                        setEstimatedDurationMinutes(event.target.value);
                                    }}
                                    placeholder="10"
                                    hasLeadingIcon={false}
                                    className="h-12"
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.estimatedDurationMinutes} />
                            </Box>
                            <Box>
                                <FieldLabel required className={fieldLabelClasses}>
                                    Seuil recommandé de validation
                                </FieldLabel>
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={validationThreshold}
                                    onChange={(event) => {
                                        clearJsonPrefillError("validationThreshold");
                                        setValidationThreshold(event.target.value);
                                    }}
                                    placeholder={String(ROLEPLAY_DEFAULT_VALIDATION_THRESHOLD_PERCENT)}
                                    hasLeadingIcon={false}
                                    className="h-12"
                                />
                                <FieldErrorMessage message={jsonPrefillFieldErrors.validationThreshold} />
                            </Box>
                        </Box>

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>
                                Titre du roleplay{" "}
                                <span className={cn("font-semibold", uiTokens.text.muted)}>
                                    (affiché sur la carte preview)
                                </span>
                            </FieldLabel>
                            <TextInput
                                value={previewTitle}
                                onChange={(event) => {
                                    clearJsonPrefillError("previewTitle");
                                    setPreviewTitle(event.target.value);
                                }}
                                placeholder="Ex : Décrocher un premier rendez-vous"
                                hasLeadingIcon={false}
                                maxLength={180}
                                className="h-12 bg-[#F3F4F6]"
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.previewTitle} />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Description courte{" "}
                                <span className="font-semibold text-[#9CA3AF]">(affichée sur la carte preview)</span>
                            </Text>
                            <TextArea
                                value={previewDescription}
                                onChange={(event) => {
                                    clearJsonPrefillError("previewDescription");
                                    setPreviewDescription(event.target.value);
                                }}
                                placeholder="Résumez l'objectif du roleplay en une ou deux phrases..."
                                rows={3}
                                maxLength={500}
                                className={uiTokens.form.textAreaMedium}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.previewDescription} />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Contexte du scénario
                            </Text>
                            <TextArea
                                value={context}
                                onChange={(event) => {
                                    clearJsonPrefillError("context");
                                    setContext(event.target.value);
                                }}
                                placeholder="Décrivez le contexte dans lequel vous contactez ce persona..."
                                rows={3}
                                className={uiTokens.form.textAreaMedium}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.context} />
                        </Box>

                        <SessionBackgroundUploadField
                            disabled={saving}
                            file={backgroundFile}
                            inputId="roleplay-session-background"
                            storedPath={backgroundImagePath}
                            onError={setFormError}
                            onFileSelected={(file) => {
                                setBackgroundFile(file);
                                setBackgroundImagePath("");
                            }}
                            onClear={() => {
                                setBackgroundFile(null);
                                setBackgroundImagePath("");
                            }}
                        />

                        <Box>
                            <FieldLabel required className={fieldLabelClasses}>
                                Votre rôle
                            </FieldLabel>
                            <TextArea
                                value={learnerRole}
                                onChange={(event) => {
                                    clearJsonPrefillError("learnerRole");
                                    setLearnerRole(event.target.value);
                                }}
                                placeholder="Décrivez le rôle de l'apprenant dans ce roleplay..."
                                rows={3}
                                maxLength={ROLEPLAY_LEARNER_ROLE_MAX_LENGTH}
                                className={uiTokens.form.textAreaMedium}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.learnerRole} />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Objectif(s) du scénario
                            </Text>
                            <TextArea
                                value={objective}
                                onChange={(event) => {
                                    clearJsonPrefillError("objective");
                                    setObjective(event.target.value);
                                }}
                                placeholder="Quel est votre objectif principal ?"
                                rows={3}
                                className={uiTokens.form.textAreaMedium}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.objective} />
                        </Box>

                        <Box>
                            <Text as="span" className={fieldLabelClasses}>
                                Freins et objections (optionnel)
                            </Text>
                            <TextArea
                                value={obstacles}
                                onChange={(event) => {
                                    clearJsonPrefillError("obstacles");
                                    setObstacles(event.target.value);
                                }}
                                placeholder="Listez les freins et objections potentiels"
                                rows={3}
                                className={uiTokens.form.textAreaMedium}
                            />
                            <FieldErrorMessage message={jsonPrefillFieldErrors.obstacles} />
                        </Box>

                        <RoleplayAiInstructionsField
                            disabled={saving}
                            onChange={(value) => {
                                clearJsonPrefillError("aiInstructions");
                                setAiInstructions(value);
                            }}
                            value={aiInstructions}
                        />
                        <FieldErrorMessage message={jsonPrefillFieldErrors.aiInstructions} />

                        <Box>
                            <Box className="flex items-center justify-between">
                                <Text as="span" className={fieldLabelClasses}>
                                    Documents d&apos;accompagnement (optionnel)
                                </Text>
                                <Button
                                    disabled={hasExistingSessions}
                                    onClick={() => {
                                        clearJsonPrefillError("resources", true);
                                        setResources((current) => [...current, emptyRoleplayResource()]);
                                    }}
                                    className={cn(
                                        uiTokens.action.addButton,
                                        "disabled:cursor-not-allowed disabled:opacity-60",
                                    )}
                                >
                                    <InlineIcon icon={Plus} className="h-3.5 w-3.5" />
                                    Ajouter un document
                                </Button>
                            </Box>
                            {resources.length > 0 && (
                                <Box className="mt-3 space-y-3">
                                    {resources.map((resource, resourceIndex) => (
                                        <Box
                                            key={resource.id ?? resource.clientFileId ?? resourceIndex}
                                            className={cn("space-y-4", uiTokens.surface.nestedCard)}
                                        >
                                            <Box className="flex items-center justify-between gap-3">
                                                <Text as="span" className={cn("text-[13px] font-extrabold", uiTokens.text.heading)}>
                                                    Document {resourceIndex + 1}
                                                </Text>
                                                <Button
                                                    aria-label={`Retirer le document ${resourceIndex + 1}`}
                                                    disabled={hasExistingSessions}
                                                    onClick={() => removeResource(resourceIndex)}
                                                    className={cn(
                                                        uiTokens.action.iconButtonGhost,
                                                        "disabled:cursor-not-allowed disabled:opacity-60",
                                                    )}
                                                >
                                                    <InlineIcon icon={X} className="h-4 w-4" />
                                                </Button>
                                            </Box>
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>Nom du document</FieldLabel>
                                                <TextInput
                                                    value={resource.label}
                                                    onChange={(event) => updateResource(resourceIndex, { label: event.target.value })}
                                                    placeholder="Ex: Fiche produit, grille de préparation..."
                                                    hasLeadingIcon={false}
                                                    className={uiTokens.form.controlWhite}
                                                />
                                            </Box>
                                            <Box>
                                                <FieldLabel className={uiTokens.form.subLabel}>Type de document</FieldLabel>
                                                <SingleSelectField
                                                    disabled={hasExistingSessions}
                                                    options={[...CONTENT_RESOURCE_DELIVERY_OPTIONS]}
                                                    value={resource.deliveryType}
                                                    placeholder="Sélectionner un type"
                                                    onChange={(value) =>
                                                        updateResourceDeliveryType(
                                                            resourceIndex,
                                                            value as RoleplayResourceDeliveryType,
                                                        )
                                                    }
                                                />
                                            </Box>
                                            {resource.deliveryType === "file" ? (
                                                <Box>
                                                    <FieldLabel className={uiTokens.form.subLabel}>Fichier du document</FieldLabel>
                                                    <FileUploadField
                                                        disabled={hasExistingSessions}
                                                        inputId={`roleplay-resource-upload-${resourceIndex}`}
                                                        file={uploadedResourcePreview(resource)}
                                                        uploadProgress={uploadProgressByClientFileId[resource.clientFileId]}
                                                        uploadPurpose={CONTENT_UPLOAD_PURPOSES.scenarioResource}
                                                        onFileSelected={(file) => updateResourceFromUpload(resourceIndex, file)}
                                                        onClear={() => clearResourceUpload(resourceIndex)}
                                                        onError={setFormError}
                                                    />
                                                </Box>
                                            ) : (
                                                <Box>
                                                    <FieldLabel className={uiTokens.form.subLabel}>URL du document</FieldLabel>
                                                    <TextInput
                                                        value={resource.externalUrl}
                                                        onChange={(event) =>
                                                            updateResource(resourceIndex, { externalUrl: event.target.value })
                                                        }
                                                        placeholder="https://..."
                                                        hasLeadingIcon={false}
                                                        className={uiTokens.form.controlWhite}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            )}
                            <FieldErrorMessage message={getJsonPrefillError(jsonPrefillFieldErrors, "resources")} />
                        </Box>
                    </Box>

                    <Box className="my-7 h-px bg-[#ECEEF3]" />

                    <Box>
                        <Text as="span" className="text-[16px] font-extrabold text-[#111827]">
                            Assignation
                        </Text>
                        <Box className="mt-4">
                            <ContentTargetScopeField
                                disabled={hasExistingSessions}
                                groupOptions={groupOptions}
                                organizationOptions={organizationOptions}
                                userOptions={userOptions}
                                value={targetScope}
                                onChange={(value) => {
                                    clearJsonPrefillError("scope");
                                    clearJsonPrefillError("organizationId");
                                    clearJsonPrefillError("groupId");
                                    clearJsonPrefillError("assignedUserId");
                                    setTargetScope(value);
                                }}
                            />
                            <FieldErrorMessage
                                message={
                                    jsonPrefillFieldErrors.scope ??
                                    jsonPrefillFieldErrors.organizationId ??
                                    jsonPrefillFieldErrors.groupId ??
                                    jsonPrefillFieldErrors.assignedUserId
                                }
                            />
                        </Box>
                    </Box>
                </CardSurface>

                <Box className="mt-6 flex justify-end gap-3">
                    <ContextualBackLink
                        fallbackHref={returnHref}
                        className="flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]"
                    >
                        Annuler
                    </ContextualBackLink>
                    <ContentEditorSubmitActions
                        canSaveDraft={canSave}
                        canSubmit={canPublish}
                        isDraft={isDraft}
                        isPending={saving}
                        publishLabel="Publier le scénario"
                        submitLabel="Enregistrer les modifications"
                    />
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

            {openEntityEditor === "method" && (
                <EntityEditorDialog title="Créer une méthode" onClose={() => setOpenEntityEditor(null)}>
                    <CreateMethodPageContent
                        embedded
                        onSaved={selectCreatedMethod}
                        organizationOptions={organizationOptions}
                        quizOptions={quizOptions}
                    />
                </EntityEditorDialog>
            )}
            {creationModeDialogOpen && (
                <EntityCreationModeDialog
                    entityLabel="Roleplay"
                    onClose={() => setCreationModeDialogOpen(false)}
                    onSelect={selectCreationMode}
                />
            )}
            {jsonPrefillDialogOpen && (
                <EntityJsonPrefillDialog
                    entityLabel="Roleplay"
                    onClose={() => setJsonPrefillDialogOpen(false)}
                    onImport={importRoleplayJson}
                    prompt={buildRoleplayJsonPrefillPrompt({
                        coachOptions: localCoachOptions,
                        groupOptions,
                        methodOptions: localMethodOptions,
                        organizationOptions,
                        personaOptions: localPersonaOptions,
                        quizOptions,
                        scorecardOptions,
                        userOptions,
                    })}
                />
            )}
        </Box>
    );
}
