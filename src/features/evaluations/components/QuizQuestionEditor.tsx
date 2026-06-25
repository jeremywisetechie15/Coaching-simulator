"use client";

import { FileText, Plus, Trash2, X } from "lucide-react";
import {
    QUIZ_ATTACHMENT_TYPES,
    QUIZ_DIMENSION_LABELS,
    QUIZ_DIMENSIONS,
    QUIZ_QUESTION_TYPE_LABELS,
    QUIZ_QUESTION_TYPES,
    type QuizAttachmentType,
    type QuizDimension,
    type QuizQuestionType,
} from "@/features/evaluations/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, Button, CardSurface, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import { FileUploadField, SingleSelectField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import {
    attachmentTypeLabels,
    attachmentDeliveryOptions,
    getDefaultQuestionDimensionForSkill,
    type QuizAttachmentDeliveryType,
    type QuizAttachmentFormState,
    type QuizChoiceFormState,
    type QuizQuestionFormState,
} from "./quiz-form-state";

interface QuizQuestionEditorProps {
    onAddAttachment: (type: QuizAttachmentType) => void;
    onAddChoice: () => void;
    onAttachmentDeliveryTypeChange: (attachmentId: string, deliveryType: QuizAttachmentDeliveryType) => void;
    onAttachmentFileSelected: (attachmentId: string, file: File) => void;
    onAttachmentPatch: (attachmentId: string, patch: Partial<QuizAttachmentFormState>) => void;
    onAttachmentUploadClear: (attachmentId: string) => void;
    onChoicePatch: (choiceId: string, patch: Partial<QuizChoiceFormState>) => void;
    onError?: (message: string) => void;
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
}

const quizAttachmentTypeOptions = QUIZ_ATTACHMENT_TYPES.map((type) => ({
    label: attachmentTypeLabels[type],
    value: type,
}));

export function QuizQuestionEditor({
    onAddAttachment,
    onAddChoice,
    onAttachmentDeliveryTypeChange,
    onAttachmentFileSelected,
    onAttachmentPatch,
    onAttachmentUploadClear,
    onChoicePatch,
    onError,
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
}: QuizQuestionEditorProps) {
    const questionCompetenceOptions = skillOptions
        .filter((skill) => stepCompetenceIds.includes(skill.id))
        .map((skill) => ({
            label: skill.name,
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
    const isDimensionLocked = Boolean(question.competenceId);
    const canAddAttachment = question.attachments.length === 0;

    function handleCompetenceChange(skillId: string) {
        const nextSkill = skillOptions.find((skill) => skill.id === skillId);

        onPatch({
            competenceId: skillId,
            dimension: getDefaultQuestionDimensionForSkill(nextSkill),
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
            <Box className="space-y-4">
                <Box className="flex items-start gap-3">
                    <Box className="flex-1 space-y-3">
                        <TextArea
                            value={question.prompt}
                            onChange={(event) => onPatch({ prompt: event.target.value })}
                            placeholder={`Question ${questionIndex + 1}...`}
                            rows={2}
                            className={uiTokens.form.textAreaWhite}
                        />
                        <SingleSelectField
                            options={QUIZ_QUESTION_TYPES.map((type) => ({
                                label: QUIZ_QUESTION_TYPE_LABELS[type],
                                value: type,
                            }))}
                            value={question.type}
                            placeholder="Type de question"
                            onChange={(value) => onQuestionTypeChange(value as QuizQuestionType)}
                        />
                    </Box>
                    {removable && (
                        <Button
                            aria-label="Supprimer la question"
                            onClick={onRemove}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                        >
                            <InlineIcon icon={Trash2} className="h-4 w-4" />
                        </Button>
                    )}
                </Box>

                <Box className="space-y-2">
                    <Text className={cn("text-[13px] font-semibold", uiTokens.text.muted)}>
                        Choix de réponse — cliquez sur le rond pour définir la bonne réponse
                    </Text>
                    {question.choices.map((choice, choiceIndex) => (
                        <Box key={choice.id} className="flex items-center gap-2">
                            <Button
                                aria-label="Marquer comme bonne réponse"
                                onClick={() =>
                                    onChoicePatch(choice.id, {
                                        isCorrect: question.type === "QCM" ? !choice.isCorrect : true,
                                    })
                                }
                                className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition",
                                    choice.isCorrect ? "border-[#5140F0]" : "border-[#9CA3AF]",
                                )}
                            >
                                {choice.isCorrect && <Box className="h-2.5 w-2.5 rounded-full bg-[#5140F0]" />}
                            </Button>
                            <TextInput
                                value={choice.label}
                                onChange={(event) => onChoicePatch(choice.id, { label: event.target.value })}
                                placeholder={`Réponse ${choiceIndex + 1}...`}
                                hasLeadingIcon={false}
                                className={uiTokens.form.controlWhite}
                            />
                            {question.choices.length > 2 && (
                                <Button
                                    aria-label="Supprimer la réponse"
                                    onClick={() => onRemoveChoice(choice.id)}
                                    className={uiTokens.action.listRemoveButton}
                                >
                                    <InlineIcon icon={X} className="h-4 w-4" />
                                </Button>
                            )}
                        </Box>
                    ))}
                    <Button onClick={onAddChoice} className={uiTokens.action.addButton}>
                        <InlineIcon icon={Plus} className="h-4 w-4" />
                        Ajouter une réponse
                    </Button>
                </Box>

                <Box className="space-y-4 rounded-[12px] border border-[#E5E7EB] bg-white p-4">
                    <Text className={cn("text-[14px] font-extrabold", uiTokens.text.heading)}>
                        Évaluation de la compétence
                    </Text>
                    <Box>
                        <FieldLabel className={uiTokens.form.subLabel}>
                            Compétence évaluée <RequiredMark />
                        </FieldLabel>
                        <SingleSelectField
                            options={questionCompetenceOptions}
                            value={question.competenceId}
                            placeholder="Sélectionner une compétence..."
                            onChange={handleCompetenceChange}
                        />
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
                                disabled={isDimensionLocked}
                                onChange={(value) =>
                                    onPatch({
                                        dimension: value as QuizDimension,
                                        dimensionItem: null,
                                        dimensionItemId: null,
                                    })
                                }
                            />
                        </Box>
                        <Box>
                            <FieldLabel className={uiTokens.form.subLabel}>
                                Item de {dimensionLabel} évalué <RequiredMark />
                            </FieldLabel>
                            <SingleSelectField
                                disabled={!question.competenceId || dimensionItemOptions.length === 0}
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
                                    const selectedItem = selectedDimensionItems.find((item) => item.id === value);
                                    onPatch({
                                        dimensionItem: selectedItem?.label ?? null,
                                        dimensionItemId: selectedItem?.id ?? null,
                                    });
                                }}
                            />
                        </Box>
                    </Box>
                    <Box className="sm:max-w-[160px]">
                        <FieldLabel className={uiTokens.form.subLabel}>Points</FieldLabel>
                        <TextInput
                            type="number"
                            min={0}
                            value={question.points}
                            onChange={(event) => onPatch({ points: event.target.value })}
                            hasLeadingIcon={false}
                            className={uiTokens.form.controlWhite}
                        />
                    </Box>
                </Box>

                <Box>
                    <FieldLabel className={uiTokens.form.subLabel}>Explication de la bonne réponse</FieldLabel>
                    <TextArea
                        value={question.explanation}
                        onChange={(event) => onPatch({ explanation: event.target.value })}
                        placeholder="Expliquez pourquoi cette réponse est correcte..."
                        rows={2}
                        className={uiTokens.form.textAreaWhite}
                    />
                </Box>

                <Box>
                    <Box className="flex items-center justify-between gap-3">
                        <FieldLabel className={uiTokens.form.subLabel}>Pièces jointes</FieldLabel>
                        {canAddAttachment && (
                            <Button onClick={() => onAddAttachment("document")} className={uiTokens.action.addButton}>
                                <InlineIcon icon={FileText} className="h-4 w-4" />
                                Ajouter un document
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
                                        {question.attachments.length === 1 ? "Document" : `Document ${attachmentIndex + 1}`}
                                    </Text>
                                    <Button
                                        aria-label={`Retirer le document ${attachmentIndex + 1}`}
                                        onClick={() => onRemoveAttachment(attachment.id)}
                                        className={uiTokens.action.iconButtonGhost}
                                    >
                                        <InlineIcon icon={X} className="h-4 w-4" />
                                    </Button>
                                </Box>
                                <Box>
                                    <FieldLabel className={uiTokens.form.subLabel}>Titre</FieldLabel>
                                    <TextInput
                                        value={attachment.label}
                                        onChange={(event) =>
                                            onAttachmentPatch(attachment.id, { label: event.target.value })
                                        }
                                        placeholder="Ex: Support de question"
                                        hasLeadingIcon={false}
                                        className={uiTokens.form.controlWhite}
                                    />
                                </Box>
                                <Box className="grid gap-3 sm:grid-cols-2">
                                    <Box>
                                        <FieldLabel className={uiTokens.form.subLabel}>Type de fichier</FieldLabel>
                                        <SingleSelectField
                                            options={quizAttachmentTypeOptions}
                                            value={attachment.type}
                                            placeholder="Sélectionner un type"
                                            onChange={(value) =>
                                                handleAttachmentTypeChange(attachment, value as QuizAttachmentType)
                                            }
                                        />
                                    </Box>
                                    {attachment.type !== "link" && (
                                        <Box>
                                            <FieldLabel className={uiTokens.form.subLabel}>Source</FieldLabel>
                                            <SingleSelectField
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
                                                inputId={`quiz-question-${question.id}-attachment-${attachment.id}`}
                                                file={attachmentUploadPreview(attachment)}
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
                                                value={attachment.externalUrl}
                                                onChange={(event) =>
                                                    onAttachmentPatch(attachment.id, { externalUrl: event.target.value })
                                                }
                                                placeholder="https://..."
                                                hasLeadingIcon={false}
                                                className={uiTokens.form.controlWhite}
                                            />
                                        </>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            </Box>
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

function RequiredMark() {
    return (
        <Text as="span" className={uiTokens.text.required}>
            *
        </Text>
    );
}
