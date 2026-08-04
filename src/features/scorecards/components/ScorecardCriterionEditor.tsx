"use client";

import { LockKeyhole, Trash2 } from "lucide-react";
import { Box, Button, CardSurface, FieldErrorMessage, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
import { SingleSelectField, type SingleSelectOption } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type { ScorecardCriterionFormState } from "./scorecard-form-state";

interface ScorecardCriterionEditorProps {
    competenceOptions: SingleSelectOption[];
    criterion: ScorecardCriterionFormState;
    dimensionItemOptions: SingleSelectOption[];
    dimensionOptions: SingleSelectOption[];
    index: number;
    fieldErrors?: Readonly<Record<string, string | undefined>>;
    onClearError?: (field: keyof ScorecardCriterionFormState) => void;
    onPatch: (patch: Partial<ScorecardCriterionFormState>) => void;
    onRemove: () => void;
    structureLocked?: boolean;
}

export function ScorecardCriterionEditor({
    competenceOptions,
    criterion,
    dimensionItemOptions,
    dimensionOptions,
    index,
    fieldErrors = {},
    onClearError,
    onPatch,
    onRemove,
    structureLocked = false,
}: ScorecardCriterionEditorProps) {
    function patchField(patch: Partial<ScorecardCriterionFormState>) {
        Object.keys(patch).forEach((field) => onClearError?.(field as keyof ScorecardCriterionFormState));
        onPatch(patch);
    }

    return (
        <CardSurface className={cn(uiTokens.surface.nestedCard, "space-y-4")}>
            <Box className="flex items-center justify-between">
                <Text className={cn("text-[12px] font-extrabold uppercase tracking-wide", uiTokens.text.muted)}>
                    Critère {index + 1}
                </Text>
                <Button
                    aria-label="Supprimer le critère"
                    disabled={structureLocked}
                    onClick={onRemove}
                    className={cn(
                        uiTokens.action.dangerIconButton,
                        "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                >
                    <InlineIcon icon={structureLocked ? LockKeyhole : Trash2} className="h-4 w-4" />
                </Button>
            </Box>

            <Box className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Critère clé</FieldLabel>
                    <TextInput
                        aria-invalid={Boolean(fieldErrors.key)}
                        value={criterion.key}
                        onChange={(event) => patchField({ key: event.target.value })}
                        placeholder="Ex : Formulation courte de la demande de mise en relation"
                        hasLeadingIcon={false}
                        className={cn(uiTokens.form.controlWhite, fieldErrors.key && uiTokens.form.controlError)}
                    />
                    <FieldErrorMessage message={fieldErrors.key} />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Ordre</FieldLabel>
                    <TextInput
                        type="number"
                        min={1}
                        value={criterion.order}
                        onChange={(event) => onPatch({ order: event.target.value })}
                        placeholder="1"
                        hasLeadingIcon={false}
                        className={uiTokens.form.controlWhite}
                    />
                </Box>
            </Box>

            <Box>
                <FieldLabel required className={uiTokens.form.subLabel}>Preuves attendues</FieldLabel>
                <TextInput
                    aria-invalid={Boolean(fieldErrors.expectedEvidence)}
                    value={criterion.expectedEvidence}
                    onChange={(event) => patchField({ expectedEvidence: event.target.value })}
                    placeholder="Ex : Prénom, nom, société, demande claire"
                    hasLeadingIcon={false}
                    className={cn(uiTokens.form.controlWhite, fieldErrors.expectedEvidence && uiTokens.form.controlError)}
                />
                <FieldErrorMessage message={fieldErrors.expectedEvidence} />
            </Box>

            <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px]">
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Compétence associée</FieldLabel>
                    <SingleSelectField
                        disabled={structureLocked}
                        hasError={Boolean(fieldErrors.competenceId)}
                        options={competenceOptions}
                        value={criterion.competenceId}
                        placeholder="Choisir..."
                        onChange={(value) =>
                            patchField({
                                competenceId: value,
                                dimensionItemId: null,
                            })
                        }
                    />
                    <FieldErrorMessage message={fieldErrors.competenceId} />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Dimension évaluée</FieldLabel>
                    <SingleSelectField
                        disabled={structureLocked}
                        hasError={Boolean(fieldErrors.dimension)}
                        options={dimensionOptions}
                        value={criterion.dimension}
                        placeholder="Choisir..."
                        onChange={(value) =>
                            patchField({
                                dimension: value as ScorecardCriterionFormState["dimension"],
                                dimensionItemId: null,
                            })
                        }
                    />
                    <FieldErrorMessage message={fieldErrors.dimension} />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Item évalué</FieldLabel>
                    <SingleSelectField
                        disabled={
                            structureLocked ||
                            !criterion.competenceId ||
                            !criterion.dimension ||
                            dimensionItemOptions.length === 0
                        }
                        hasError={Boolean(fieldErrors.dimensionItemId)}
                        options={dimensionItemOptions}
                        value={criterion.dimensionItemId}
                        placeholder={
                            criterion.competenceId && criterion.dimension
                                ? "Choisir..."
                                : "Compétence + dimension"
                        }
                        onChange={(value) => patchField({ dimensionItemId: value })}
                    />
                    <FieldErrorMessage message={fieldErrors.dimensionItemId} />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Points max</FieldLabel>
                    <TextInput
                        aria-invalid={Boolean(fieldErrors.maxPoints)}
                        type="number"
                        min={1}
                        value={criterion.maxPoints}
                        onChange={(event) => patchField({ maxPoints: event.target.value })}
                        placeholder="Ex : 4"
                        hasLeadingIcon={false}
                        className={cn(uiTokens.form.controlWhite, fieldErrors.maxPoints && uiTokens.form.controlError)}
                    />
                    <FieldErrorMessage message={fieldErrors.maxPoints} />
                </Box>
            </Box>

            <Box>
                <FieldLabel className={uiTokens.form.subLabel}>
                    Consigne d&apos;analyse IA <OptionalHint />
                </FieldLabel>
                <TextArea
                    aria-invalid={Boolean(fieldErrors.aiInstruction)}
                    value={criterion.aiInstruction}
                    onChange={(event) => patchField({ aiInstruction: event.target.value })}
                    placeholder="Ex : Évaluer si la demande est claire, courte et orientée action"
                    rows={2}
                    className={cn(uiTokens.form.textAreaWhite, fieldErrors.aiInstruction && uiTokens.form.controlError)}
                />
                <FieldErrorMessage message={fieldErrors.aiInstruction} />
            </Box>

            <Box>
                <FieldLabel required className={uiTokens.form.subLabel}>Exemple de verbatim conformes</FieldLabel>
                <TextArea
                    aria-invalid={Boolean(fieldErrors.verbatim)}
                    value={criterion.verbatim}
                    onChange={(event) => patchField({ verbatim: event.target.value })}
                    placeholder="« Pouvez-vous me le/la passer, s'il vous plaît ? »"
                    rows={2}
                    className={cn(uiTokens.form.textAreaWhite, fieldErrors.verbatim && uiTokens.form.controlError)}
                />
                <FieldErrorMessage message={fieldErrors.verbatim} />
            </Box>
        </CardSurface>
    );
}

function OptionalHint() {
    return (
        <Text as="span" className={cn("font-medium", uiTokens.text.muted)}>
            Optionnel
        </Text>
    );
}
