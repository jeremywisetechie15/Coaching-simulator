"use client";

import { Check, Copy, FileJson, FileUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { EntityJsonPrefillFileField } from "./EntityJsonPrefillFileField";

interface EntityJsonPrefillDialogProps {
    entityLabel: string;
    onClose: () => void;
    onImport: (file: File) => Promise<void> | void;
    prompt: string;
}

export function EntityJsonPrefillDialog({
    entityLabel,
    onClose,
    onImport,
    prompt,
}: EntityJsonPrefillDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isReading, setIsReading] = useState(false);
    const [promptCopied, setPromptCopied] = useState(false);

    async function copyPrompt() {
        try {
            await navigator.clipboard.writeText(prompt);
            setPromptCopied(true);
            setError(null);
        } catch {
            setPromptCopied(false);
            setError("Le prompt n’a pas pu être copié. Autorisez l’accès au presse-papiers puis réessayez.");
        }
    }

    async function importFile() {
        if (!file || isReading) {
            if (!file) setError("Sélectionnez un fichier JSON à importer.");
            return;
        }

        setError(null);
        setIsReading(true);

        try {
            await onImport(file);
            setFile(null);
            onClose();
        } catch (importError) {
            setError(
                importError instanceof Error
                    ? importError.message
                    : "Le fichier JSON n’a pas pu être lu.",
            );
        } finally {
            setIsReading(false);
        }
    }

    return (
        <Modal
            className={uiTokens.jsonPrefill.dialogPanel}
            description="Importez un fichier conforme au modèle de l’entité. Les champs restent modifiables avant l’enregistrement."
            onClose={onClose}
            title={`Préremplir — ${entityLabel}`}
        >
            <Box className={uiTokens.jsonPrefill.shell}>
                <Box className={uiTokens.jsonPrefill.hero}>
                    <Box aria-hidden="true" className={uiTokens.jsonPrefill.heroAccent} />
                    <Box className="relative flex items-start gap-3">
                        <Box className={uiTokens.jsonPrefill.heroIcon}>
                            <InlineIcon icon={FileJson} className="h-5 w-5" />
                        </Box>
                        <Box>
                            <Text className={uiTokens.jsonPrefill.heroTitle}>
                                Un formulaire prérempli, toujours sous votre contrôle
                            </Text>
                            <Text className={uiTokens.jsonPrefill.heroDescription}>
                                Les valeurs valides seront appliquées. Les champs absents ou incorrects seront signalés directement dans le formulaire.
                            </Text>
                        </Box>
                    </Box>
                </Box>

                {error && <AlertMessage message={error} />}

                <Box className={uiTokens.jsonPrefill.promptCard}>
                    <Box className={uiTokens.jsonPrefill.promptContent}>
                        <Box className={uiTokens.jsonPrefill.promptIcon}>
                            <InlineIcon icon={Sparkles} className="h-4 w-4" />
                        </Box>
                        <Box>
                            <Text className={uiTokens.jsonPrefill.promptTitle}>
                                Générer le fichier avec votre IA
                            </Text>
                            <Text className={uiTokens.jsonPrefill.promptDescription}>
                                Le prompt contient la structure attendue, les règles de validation et les identifiants actuellement autorisés.
                            </Text>
                        </Box>
                    </Box>
                    <Button
                        onClick={() => void copyPrompt()}
                        className={uiTokens.jsonPrefill.promptButton}
                    >
                        <InlineIcon icon={promptCopied ? Check : Copy} className="h-4 w-4" />
                        {promptCopied ? "Prompt copié" : "Copier le prompt IA"}
                    </Button>
                    <Text aria-live="polite" className={uiTokens.jsonPrefill.promptStatus}>
                        {promptCopied ? "Le prompt est prêt à être collé dans votre outil IA." : ""}
                    </Text>
                </Box>

                <EntityJsonPrefillFileField
                    disabled={isReading}
                    file={file}
                    onClear={() => {
                        setFile(null);
                        setError(null);
                    }}
                    onError={setError}
                    onFileSelected={(selectedFile) => {
                        setFile(selectedFile);
                        setError(null);
                    }}
                />

                <Box className={uiTokens.jsonPrefill.footer}>
                    <Button
                        disabled={isReading}
                        onClick={onClose}
                        className={uiTokens.jsonPrefill.cancelButton}
                    >
                        Annuler
                    </Button>
                    <Button
                        disabled={!file || isReading}
                        onClick={() => void importFile()}
                        className={uiTokens.jsonPrefill.primaryButton}
                    >
                        <InlineIcon icon={FileUp} className="h-4 w-4" />
                        {isReading ? "Lecture..." : "Préremplir le formulaire"}
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}
