"use client";

import { PanelRightOpen } from "lucide-react";
import { useId, useRef, useState } from "react";
import { ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH } from "@/features/roleplays/domain";
import { Box, Button, FieldLabel, InlineIcon, Text, TextArea } from "@/lib/ui/atoms";
import { Drawer } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";

interface RoleplayAiInstructionsFieldProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    value: string;
}

const AI_INSTRUCTIONS_PLACEHOLDER = `Décrivez ici les instructions détaillées pour l'IA :
• Informations que le persona connaît
• Comportement attendu
• Réactions aux actions de l'apprenant
• Objections cachées et conditions de déclenchement
• Règles de conversation et de style
• Conditions de succès ou d'échec`;

export function RoleplayAiInstructionsField({
    disabled = false,
    onChange,
    value,
}: RoleplayAiInstructionsFieldProps) {
    const drawerId = useId();
    const drawerNoteId = useId();
    const drawerTextAreaId = useId();
    const fieldHelpId = useId();
    const fieldId = useId();
    const editorTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    return (
        <Box>
            <Box className={uiTokens.roleplayEditor.aiInstructionsHeader}>
                <Box className={uiTokens.roleplayEditor.aiInstructionsHeading}>
                    <FieldLabel htmlFor={fieldId} className={uiTokens.form.label}>
                        Instructions IA du scénario (non visible par l&apos;apprenant)
                    </FieldLabel>
                    <Text id={fieldHelpId} className={uiTokens.form.helpText}>
                        Définissez comment le persona IA doit agir, réagir et faire évoluer la conversation.
                    </Text>
                </Box>
                <Button
                    aria-controls={drawerId}
                    aria-expanded={isEditorOpen}
                    aria-haspopup="dialog"
                    className={uiTokens.action.accentSecondaryButton}
                    disabled={disabled}
                    onClick={() => setIsEditorOpen(true)}
                >
                    <InlineIcon icon={PanelRightOpen} className="h-4 w-4" />
                    Ouvrir l&apos;éditeur
                </Button>
            </Box>

            <TextArea
                id={fieldId}
                name="aiInstructions"
                aria-describedby={fieldHelpId}
                className={uiTokens.form.textAreaLarge}
                disabled={disabled}
                maxLength={ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH}
                onChange={(event) => onChange(event.target.value)}
                placeholder={AI_INSTRUCTIONS_PLACEHOLDER}
                rows={8}
                value={value}
            />

            {isEditorOpen && (
                <Drawer
                    id={drawerId}
                    bodyClassName={uiTokens.drawer.bodyEditor}
                    className={uiTokens.drawer.panelEditor}
                    description="Rédigez et relisez confortablement toutes les consignes données au persona IA."
                    initialFocusRef={editorTextAreaRef}
                    onClose={() => setIsEditorOpen(false)}
                    title="Instructions IA du scénario"
                >
                    <Box className={uiTokens.roleplayEditor.aiInstructionsDrawerContent}>
                        <FieldLabel htmlFor={drawerTextAreaId} className="sr-only">
                            Instructions IA du scénario
                        </FieldLabel>
                        <TextArea
                            id={drawerTextAreaId}
                            ref={editorTextAreaRef}
                            aria-describedby={drawerNoteId}
                            className={uiTokens.form.textAreaEditor}
                            disabled={disabled}
                            maxLength={ROLEPLAY_AI_INSTRUCTIONS_MAX_LENGTH}
                            onChange={(event) => onChange(event.target.value)}
                            placeholder={AI_INSTRUCTIONS_PLACEHOLDER}
                            value={value}
                        />
                        <Text id={drawerNoteId} className={uiTokens.form.helpText}>
                            Les modifications seront enregistrées avec le scénario.
                        </Text>
                    </Box>
                </Drawer>
            )}
        </Box>
    );
}
