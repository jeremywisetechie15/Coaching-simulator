"use client";

import { ChevronDown, ChevronUp, FileText, Paperclip, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
    QUIZ_ATTACHMENT_TYPES,
    QUIZ_DIMENSION_LABELS,
    QUIZ_DIMENSIONS,
    QUIZ_EVALUATED_DIMENSION,
    QUIZ_QUESTION_TYPE_LABELS,
    QUIZ_QUESTION_TYPES,
    type QuizAttachmentType,
    type QuizDimension,
    type QuizQuestionType,
} from "@/features/evaluations/domain";
import { getEntitySelectionLabel } from "@/features/content/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, Button, CardSurface, FieldErrorMessage, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import { FileUploadField, SingleSelectField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    attachmentTypeLabels,
    attachmentDeliveryOptions,
    integerFromText,
    type QuizAttachmentDeliveryType,
    type QuizAttachmentFormState,
    type QuizChoiceFormState,
    type QuizQuestionFormState,
} from "./quiz-form-state";

interface QuizQuestionEditorProps {
    fieldErrors?: Readonly<Record<string, string | undefined>>;
    onAddAttachment: (type: QuizAttachmentType) => void;
    onAddChoice: () => void;
    onAttachmentDeliveryTypeChange: (attachmentId: string, deliveryType: QuizAttachmentDeliveryType) => void;
    onAttachmentFileSelected: (attachmentId: string, file: File) => void;
    onAttachmentPatch: (attachmentId: string, patch: Partial<QuizAttachmentFormState>) => void;
    onAttachmentUploadClear: (attachmentId: string) => void;
    onChoicePatch: (choiceId: string, patch: Partial<QuizChoiceFormState>) => void;
    onError?: (message: string) => void;
    onClearError?: (path: string, descendants?: boolean) => void;
    onPatch: (patch: Partial<QuizQuestionFormState>) => void;
    onQuestionTypeChange: (type: QuizQuestionType) => void;
    onRemove: () => void;
    onRemoveAttachment: (attachmentId: string) => void;
    onRemoveChoice: (choiceId: string) => void;
    question: QuizQuestionFormState;
    questionIndex: number;
    removable: boolean;
    skillOptions: SkillOption[];
    stepCompetenceIds: string[];
    structureLocked?: boolean;
    uploadProgressByClientFileId?: Readonly<Record<string, number>>;
}

const quizAttachmentTypeOptions = QUIZ_ATTACHMENT_TYPES.map((type) => ({
    label: attachmentTypeLabels[type],
    value: type,
}));

export function QuizQuestionEditor({
    fieldErrors = {},
    onAddAttachment,
    onAddChoice,
    onAttachmentDeliveryTypeChange,
    onAttachmentFileSelected,
    onAttachmentPatch,
    onAttachmentUploadClear,
    onChoicePatch,
    onError,
    onClearError,
    onPatch,
    onQuestionTypeChange,
    onRemove,
    onRemoveAttachment,
    onRemoveChoice,
    question,
    questionIndex,
    removable,
    skillOptions,
    stepCompetenceIds,
    structureLocked,
    uploadProgressByClientFileId,
}: QuizQuestionEditorProps) {
    const questionCompetenceOptions = skillOptions
        .filter((skill) => stepCompetenceIds.includes(skill.id))
        .map((skill) => ({
            disabled: skill.isSelectable === false,
            label: getEntitySelectionLabel(skill.name, skill),
            value: skill.id,
        }));
    const dimensionLabel = QUIZ_DIMENSION_LABELS[question.dimension];
    const selectedSkill = skillOptions.find((skill) => skill.id === question.competenceId);
    const selectedDimensionItems = (selectedSkill?.dimensionItems ?? [])
        .filter((item) => item.isActive && item.dimension === question.dimension)
        .slice()
        .sort((first, second) => first.order - second.order);
    const dimensionItemOptions = selectedDimensionItems.map((item) => ({
        label: item.label,
        value: item.id,
    }));
    const dimensionItemValue = question.dimensionItemId ?? question.dimensionItem;
    const canAddAttachment = question.attachments.length === 0;
    const [collapsed, setCollapsed] = useState(false);
    const bodyId = `quiz-question-${question.id}-body`;
    const attachmentCount = question.attachments.length;
    const points = integerFromText(question.points, 1);

    function handleCompetenceChange(skillId: string) {
        onClearError?.("competenceId");
        onClearError?.("dimensionItemId");
        onPatch({
            competenceId: skillId,
            dimension: QUIZ_EVALUATED_DIMENSION,
            dimensionItem: null,
            dimensionItemId: null,
        });
    }

    function handleAttachmentTypeChange(attachment: QuizAttachmentFormState, nextType: QuizAttachmentType) {
        if (nextType === attachment.type) return;

        onAttachmentPatch(attachment.id, {
            clientFileId: "",
            deliveryType: nextType === "link" ? "url" : attachment.deliveryType,
            file: null,
            storageBucket: "",
            storagePath: "",
            type: nextType,
            uploadedFileName: "",
            uploadedFileSizeBytes: null,
        });
    }

    return (
        <CardSurface className={uiTokens.surface.nestedCard}>
            <Box className={uiTokens.quizQuestionEditor.header}>
                <Box className={uiTokens.quizQuestionEditor.identity}>
                    <Text as="h3" className={uiTokens.quizQuestionEditor.title}>
                        Question {questionIndex + 1}
                    </Text>
                    {collapsed && (
                        <Text className={uiTokens.quizQuestionEditor.prompt}>
                            {question.prompt.trim() || "Énoncé non renseigné"}
                        </Text>
                    )}
                    <Box className={uiTokens.quizQuestionEditor.metadata}>
                        <Text as="span" className={uiTokens.quizQuestionEditor.metadataBadge}>
                            {QUIZ_QUESTION_TYPE_LABELS[question.type]}
                        </Text>
                        <Text as="span" className={uiTokens.quizQuestionEditor.metadataBadge}>
                            {points} point{points > 1 ? "s" : ""}
                        </Text>
                        {attachmentCount > 0 && (
                            <Text
                                as="span"
                                className={uiTokens.quizQuestionEditor.attachmentBadge}
                            >
                                <InlineIcon
                                    icon={Paperclip}
                                    className={uiTokens.quizQuestionEditor.metadataIcon}
                                />
                                {attachmentCount} pièce{attachmentCount > 1 ? "s" : ""} jointe
                                {attachmentCount > 1 ? "s" : ""}
                            </Text>
                        )}
                    </Box>
                </Box>
                <Box className={uiTokens.quizQuestionEditor.actions}>
                    <Button
                        aria-controls={bodyId}
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? "Déplier la question" : "Replier la question"}
                        onClick={() => setCollapsed((current) => !current)}
                        className={uiTokens.action.iconButtonGhost}
                    >
                        <InlineIcon
                            icon={collapsed ? ChevronDown : ChevronUp}
                            className={uiTokens.quizQuestionEditor.actionIcon}
                        />
                    </Button>
                    {removable && (
                        <Button
                            aria-label="Supprimer la question"
                            disabled={structureLocked}
                            onClick={onRemove}
                            className={cn(
                                uiTokens.action.dangerIconButton,
                                "disabled:cursor-not-allowed disabled:opacity-50",
                            )}
                        >
                            <InlineIcon
                                icon={Trash2}
                                className={uiTokens.quizQuestionEditor.actionIcon}
                            />
                        </Button>
                    )}
                </Box>
            </Box>

            {!collapsed && (
                <Box id={bodyId} className={uiTokens.quizQuestionEditor.body}>
                    <Box className="space-y-3">
                        <FieldLabel required className={uiTokens.form.subLabel}>Énoncé de la question</FieldLabel>
                        <TextArea
                            aria-invalid={Boolean(fieldErrors.prompt)}
                            value={question.prompt}
                            onChange={(event) => {
                                onClearError?.("prompt");
                                onPatch({ prompt: event.target.value });
                            }}
                            placeholder={`Question ${questionIndex + 1}...`}
                            rows={2}
                            className={cn(uiTokens.form.textAreaWhite, fieldErrors.prompt && uiTokens.form.controlError)}
                        />
                        <FieldErrorMessage message={fieldErrors.prompt} />
                        <SingleSelectField
                            disabled={structureLocked}
                            hasError={Boolean(fieldErrors.type)}
                            options={QUIZ_QUESTION_TYPES.map((type) => ({
                                label: QUIZ_QUESTION_TYPE_LABELS[type],
                                value: type,
                            }))}
                            value={question.type}
                            placeholder="Type de question"
                            onChange={(value) => {
                                onClearError?.("type");
                                onClearError?.("choices", true);
                                onQuestionTypeChange(value as QuizQuestionType);
                            }}
                        />
                        <FieldErrorMessage message={fieldErrors.type} />
                    </Box>

                <Box className="space-y-2">
                    <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                        Choix de réponse — cliquez sur le rond pour définir la bonne réponse
                    </Text>
                    {question.choices.map((choice, choiceIndex) => (
                        <Box key={choice.id} className="flex items-center gap-2">
                            <Button
                                aria-label="Marquer comme bonne réponse"
                                disabled={structureLocked}
                                onClick={() => {
                                    onClearError?.("choices", true);
                                    onChoicePatch(choice.id, {
                                        isCorrect: question.type === "QCM" ? !choice.isCorrect : true,
                                    });
                                }}
                                className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition disabled:cursor-not-allowed disabled:opacity-60",
                                    choice.isCorrect ? "border-[#5140F0]" : "border-[#9CA3AF]",
                                )}
                            >
                                {choice.isCorrect && <Box className="h-2.5 w-2.5 rounded-full bg-[#5140F0]" />}
                            </Button>
                            <TextInput
                                aria-invalid={Boolean(fieldErrors[`choices.${choiceIndex}.label`])}
                                value={choice.label}
                                onChange={(event) => {
                                    onClearError?.(`choices.${choiceIndex}.label`);
                                    onChoicePatch(choice.id, { label: event.target.value });
                                }}
                                placeholder={`Réponse ${choiceIndex + 1}...`}
                                hasLeadingIcon={false}
                                className={cn(
                                    uiTokens.form.controlWhite,
                                    fieldErrors[`choices.${choiceIndex}.label`] && uiTokens.form.controlError,
                                )}
                            />
                            {question.choices.length > 2 && (
                                <Button
                                    aria-label="Supprimer la réponse"
                                    disabled={structureLocked}
                                    onClick={() => {
                                        onClearError?.("choices", true);
                                        onRemoveChoice(choice.id);
                                    }}
                                    className={cn(
                                        uiTokens.action.listRemoveButton,
                                        "disabled:cursor-not-allowed disabled:opacity-50",
                                    )}
                                >
                                    <InlineIcon icon={X} className="h-4 w-4" />
                                </Button>
                            )}
                        </Box>
                    ))}
                    <FieldErrorMessage message={fieldErrors.choices} />
                    <Button
                        disabled={structureLocked}
                        onClick={() => {
                            onClearError?.("choices", true);
                            onAddChoice();
                        }}
                        className={cn(
                            uiTokens.action.addButton,
                            "disabled:cursor-not-allowed disabled:opacity-50",
                        )}
                    >
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Ajouter une réponse
                    </Button>
                </Box>

                <Box className="space-y-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                    <Text className={cn("text-[14px] font-extrabold", uiTokens.text.heading)}>
                        Évaluation de la compétence
                    </Text>
                    <Box>
                        <FieldLabel required className={uiTokens.form.subLabel}>Compétence évaluée</FieldLabel>
                        <SingleSelectField
                            disabled={structureLocked}
                            hasError={Boolean(fieldErrors.competenceId)}
                            options={questionCompetenceOptions}
                            value={question.competenceId}
                            placeholder="Sélectionner une compétence..."
                            onChange={handleCompetenceChange}
                        />
                        <FieldErrorMessage message={fieldErrors.competenceId} />
                    </Box>
                    <Box className="grid gap-4 sm:grid-cols-2">
                        <Box>
                            <FieldLabel className={uiTokens.form.subLabel}>Dimension évaluée</FieldLabel>
                            <SingleSelectField
                                options={QUIZ_DIMENSIONS.map((dimension) => ({
                                    label: QUIZ_DIMENSION_LABELS[dimension],
                                    value: dimension,
                                }))}
                                value={question.dimension}
                                placeholder="Dimension"
                                disabled
                                onChange={(value) =>
                                    onPatch({
                                        dimension: value as QuizDimension,
                                        dimensionItem: null,
                                        dimensionItemId: null,
                                    })
                                }
                                hasError={Boolean(fieldErrors.dimensionItemId)}
                            />
                        </Box>
                        <Box>
                            <FieldLabel required className={uiTokens.form.subLabel}>
                                Item de {dimensionLabel} évalué
                            </FieldLabel>
                            <SingleSelectField
                                disabled={
                                    structureLocked ||
                                    !question.competenceId ||
                                    dimensionItemOptions.length === 0
                                }
                                options={dimensionItemOptions}
                                value={dimensionItemValue}
                                placeholder={
                                    !question.competenceId
                                        ? "Sélectionnez d'abord une compétence"
                                        : dimensionItemOptions.length > 0
                                          ? `Sélectionner un item de ${dimensionLabel}...`
                                          : "Aucun item disponible pour cette dimension"
                                }
                                onChange={(value) => {
                                    onClearError?.("dimensionItemId");
                                    const selectedItem = selectedDimensionItems.find((item) => item.id === value);
                                    onPatch({
                                        dimensionItem: selectedItem?.label ?? null,
                                        dimensionItemId: selectedItem?.id ?? null,
                                    });
                                }}
                            />
                            <FieldErrorMessage message={fieldErrors.dimensionItemId} />
                        </Box>
                    </Box>
                    <Box className="sm:max-w-[160px]">
                        <FieldLabel className={uiTokens.form.subLabel}>Points</FieldLabel>
                        <TextInput
                            aria-invalid={Boolean(fieldErrors.points)}
                            type="number"
                            min={0}
                            value={question.points}
                            onChange={(event) => {
                                onClearError?.("points");
                                onPatch({ points: event.target.value });
                            }}
                            hasLeadingIcon={false}
                            className={cn(uiTokens.form.controlWhite, fieldErrors.points && uiTokens.form.controlError)}
                        />
                        <FieldErrorMessage message={fieldErrors.points} />
                    </Box>
                </Box>

                <Box>
                    <FieldLabel className={uiTokens.form.subLabel}>Explication de la bonne réponse</FieldLabel>
                    <TextArea
                        aria-invalid={Boolean(fieldErrors.explanation)}
                        value={question.explanation}
                        onChange={(event) => {
                            onClearError?.("explanation");
                            onPatch({ explanation: event.target.value });
                        }}
                        placeholder="Expliquez pourquoi cette réponse est correcte..."
                        rows={2}
                        className={cn(uiTokens.form.textAreaWhite, fieldErrors.explanation && uiTokens.form.controlError)}
                    />
                    <FieldErrorMessage message={fieldErrors.explanation} />
                </Box>

                <Box>
                    <Box className="flex items-center justify-between gap-3">
                        <FieldLabel className={uiTokens.form.subLabel}>Pièces jointes</FieldLabel>
                        {canAddAttachment && (
                            <Button
                                disabled={structureLocked}
                                onClick={() => {
                                    onClearError?.("attachments", true);
                                    onAddAttachment("document");
                                }}
                                className={cn(
                                    uiTokens.action.addButton,
                                    "disabled:cursor-not-allowed disabled:opacity-50",
                                )}
                            >
                                <InlineIcon icon={FileText} className="h-4 w-4" />
                                Ajouter une pièce jointe
                            </Button>
                        )}
                    </Box>
                    <Box className="mt-3 space-y-3">
                        {question.attachments.map((attachment, attachmentIndex) => (
                            <Box key={attachment.id} className={cn("space-y-4", uiTokens.surface.nestedCard)}>
                                <Box className="flex items-center justify-between gap-3">
                                    <Text
                                        as="span"
                                        className={cn("text-[13px] font-extrabold", uiTokens.text.heading)}
                                    >
                                        {question.attachments.length === 1
                                            ? "Pièce jointe"
                                            : `Pièce jointe ${attachmentIndex + 1}`}
                                    </Text>
                                    <Button
                                        aria-label={`Retirer la pièce jointe ${attachmentIndex + 1}`}
                                        disabled={structureLocked}
                                        onClick={() => {
                                            onClearError?.("attachments", true);
                                            onRemoveAttachment(attachment.id);
                                        }}
                                        className={cn(
                                            uiTokens.action.iconButtonGhost,
                                            "disabled:cursor-not-allowed disabled:opacity-50",
                                        )}
                                    >
                                        <InlineIcon icon={X} className="h-4 w-4" />
                                    </Button>
                                </Box>
                                <Box>
                                    <FieldLabel className={uiTokens.form.subLabel}>Titre</FieldLabel>
                                    <TextInput
                                        aria-invalid={Boolean(fieldErrors[`attachments.${attachmentIndex}.label`])}
                                        value={attachment.label}
                                        onChange={(event) => {
                                            onClearError?.(`attachments.${attachmentIndex}.label`);
                                            onAttachmentPatch(attachment.id, { label: event.target.value });
                                        }}
                                        placeholder="Ex: Support de question"
                                        hasLeadingIcon={false}
                                        className={cn(
                                            uiTokens.form.controlWhite,
                                            fieldErrors[`attachments.${attachmentIndex}.label`] && uiTokens.form.controlError,
                                        )}
                                    />
                                    <FieldErrorMessage message={fieldErrors[`attachments.${attachmentIndex}.label`]} />
                                </Box>
                                <Box className="grid gap-3 sm:grid-cols-2">
                                    <Box>
                                        <FieldLabel className={uiTokens.form.subLabel}>Type de fichier</FieldLabel>
                                        <SingleSelectField
                                            disabled={structureLocked}
                                            hasError={Boolean(fieldErrors[`attachments.${attachmentIndex}.type`])}
                                            options={quizAttachmentTypeOptions}
                                            value={attachment.type}
                                            placeholder="Sélectionner un type"
                                            onChange={(value) => {
                                                onClearError?.(`attachments.${attachmentIndex}.type`);
                                                handleAttachmentTypeChange(attachment, value as QuizAttachmentType);
                                            }}
                                        />
                                        <FieldErrorMessage message={fieldErrors[`attachments.${attachmentIndex}.type`]} />
                                    </Box>
                                    {attachment.type !== "link" && (
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Source</FieldLabel>
                                            <SingleSelectField
                                                disabled={structureLocked}
                                                options={[...attachmentDeliveryOptions]}
                                                value={attachment.deliveryType}
                                                placeholder="Sélectionner"
                                                onChange={(value) =>
                                                    onAttachmentDeliveryTypeChange(
                                                        attachment.id,
                                                        value as QuizAttachmentDeliveryType,
                                                    )
                                                }
                                            />
                                        </Box>
                                    )}
                                </Box>
                                <Box>
                                    {attachment.type !== "link" && attachment.deliveryType === "file" ? (
                                        <>
                                            <FieldLabel className={uiTokens.form.subLabel}>Fichier</FieldLabel>
                                            <FileUploadField
                                                disabled={structureLocked}
                                                inputId={`quiz-question-${question.id}-attachment-${attachment.id}`}
                                                file={attachmentUploadPreview(attachment)}
                                                uploadProgress={uploadProgressByClientFileId?.[attachment.clientFileId]}
                                                uploadPurpose={CONTENT_UPLOAD_PURPOSES.quizAttachment}
                                                onFileSelected={(file) => onAttachmentFileSelected(attachment.id, file)}
                                                onClear={() => onAttachmentUploadClear(attachment.id)}
                                                onError={onError}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <FieldLabel className={uiTokens.form.subLabel}>URL</FieldLabel>
                                            <TextInput
                                                aria-invalid={Boolean(fieldErrors[`attachments.${attachmentIndex}.externalUrl`])}
                                                value={attachment.externalUrl}
                                                onChange={(event) => {
                                                    onClearError?.(`attachments.${attachmentIndex}.externalUrl`);
                                                    onAttachmentPatch(attachment.id, { externalUrl: event.target.value });
                                                }}
                                                placeholder="https://..."
                                                hasLeadingIcon={false}
                                                className={cn(
                                                    uiTokens.form.controlWhite,
                                                    fieldErrors[`attachments.${attachmentIndex}.externalUrl`] && uiTokens.form.controlError,
                                                )}
                                            />
                                            <FieldErrorMessage message={fieldErrors[`attachments.${attachmentIndex}.externalUrl`]} />
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                    <FieldErrorMessage message={fieldErrors.attachments} />
                </Box>
                </Box>
            )}
        </CardSurface>
    );
}

function attachmentUploadPreview(attachment: QuizAttachmentFormState) {
    if (attachment.file) {
        return {
            fileName: attachment.file.name,
            sizeBytes: attachment.file.size,
        };
    }

    if (!attachment.storageBucket || !attachment.storagePath) return null;

    return {
        fileName: attachment.uploadedFileName || attachment.label || attachment.storagePath,
        sizeBytes: attachment.uploadedFileSizeBytes,
    };
}
