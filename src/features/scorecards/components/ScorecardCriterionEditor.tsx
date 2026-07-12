"use client";

import { Trash2 } from "lucide-react";
import { Box, Button, CardSurface, FieldLabel, InlineIcon, Text, TextArea, TextInput } from "@/lib/ui/atoms";
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
    onPatch: (patch: Partial<ScorecardCriterionFormState>) => void;
    onRemove: () => void;
}

export function ScorecardCriterionEditor({
    competenceOptions,
    criterion,
    dimensionItemOptions,
    dimensionOptions,
    index,
    onPatch,
    onRemove,
}: ScorecardCriterionEditorProps) {
    return (
        <CardSurface className={cn(uiTokens.surface.nestedCard, "space-y-4")}>
            <Box className="flex items-center justify-between">
                <Text className={cn("text-[12px] font-extrabold uppercase tracking-wide", uiTokens.text.muted)}>
                    Critère {index + 1}
                </Text>
                <Button
                    aria-label="Supprimer le critère"
                    onClick={onRemove}
                    className={uiTokens.action.dangerIconButton}
                >
                    <InlineIcon icon={Trash2} className="h-4 w-4" />
                </Button>
            </Box>

            <Box className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_110px]">
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Critère clé</FieldLabel>
                    <TextInput
                        value={criterion.key}
                        onChange={(event) => onPatch({ key: event.target.value })}
                        placeholder="Ex : Formulation courte de la demande de mise en relation"
                        hasLeadingIcon={false}
                        className={uiTokens.form.controlWhite}
                    />
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
                    value={criterion.expectedEvidence}
                    onChange={(event) => onPatch({ expectedEvidence: event.target.value })}
                    placeholder="Ex : Prénom, nom, société, demande claire"
                    hasLeadingIcon={false}
                    className={uiTokens.form.controlWhite}
                />
            </Box>

            <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_110px]">
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Compétence associée</FieldLabel>
                    <SingleSelectField
                        options={competenceOptions}
                        value={criterion.competenceId}
                        placeholder="Choisir..."
                        onChange={(value) =>
                            onPatch({
                                competenceId: value,
                                dimensionItemId: null,
                            })
                        }
                    />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Dimension évaluée</FieldLabel>
                    <SingleSelectField
                        options={dimensionOptions}
                        value={criterion.dimension}
                        placeholder="Choisir..."
                        onChange={(value) =>
                            onPatch({
                                dimension: value as ScorecardCriterionFormState["dimension"],
                                dimensionItemId: null,
                            })
                        }
                    />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Item évalué</FieldLabel>
                    <SingleSelectField
                        disabled={!criterion.competenceId || !criterion.dimension || dimensionItemOptions.length === 0}
                        options={dimensionItemOptions}
                        value={criterion.dimensionItemId}
                        placeholder={
                            criterion.competenceId && criterion.dimension
                                ? "Choisir..."
                                : "Compétence + dimension"
                        }
                        onChange={(value) => onPatch({ dimensionItemId: value })}
                    />
                </Box>
                <Box>
                    <FieldLabel required className={uiTokens.form.subLabel}>Points max</FieldLabel>
                    <TextInput
                        type="number"
                        min={1}
                        value={criterion.maxPoints}
                        onChange={(event) => onPatch({ maxPoints: event.target.value })}
                        placeholder="Ex : 4"
                        hasLeadingIcon={false}
                        className={uiTokens.form.controlWhite}
                    />
                </Box>
            </Box>

            <Box>
                <FieldLabel className={uiTokens.form.subLabel}>
                    Consigne d&apos;analyse IA <OptionalHint />
                </FieldLabel>
                <TextArea
                    value={criterion.aiInstruction}
                    onChange={(event) => onPatch({ aiInstruction: event.target.value })}
                    placeholder="Ex : Évaluer si la demande est claire, courte et orientée action"
                    rows={2}
                    className={uiTokens.form.textAreaWhite}
                />
            </Box>

            <Box>
                <FieldLabel required className={uiTokens.form.subLabel}>Exemple de verbatim conformes</FieldLabel>
                <TextArea
                    value={criterion.verbatim}
                    onChange={(event) => onPatch({ verbatim: event.target.value })}
                    placeholder="« Pouvez-vous me le/la passer, s'il vous plaît ? »"
                    rows={2}
                    className={uiTokens.form.textAreaWhite}
                />
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
