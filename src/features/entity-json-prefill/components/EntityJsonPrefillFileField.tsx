"use client";

import { ShieldCheck } from "lucide-react";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, FieldLabel, InlineIcon, Text } from "@/lib/ui/atoms";
import { FileUploadField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";

interface EntityJsonPrefillFileFieldProps {
    disabled?: boolean;
    file: File | null;
    onClear: () => void;
    onError: (message: string) => void;
    onFileSelected: (file: File) => void;
}

export function EntityJsonPrefillFileField({
    disabled,
    file,
    onClear,
    onError,
    onFileSelected,
}: EntityJsonPrefillFileFieldProps) {
    return (
        <Box>
            <FieldLabel
                htmlFor="entity-json-prefill-file"
                required
                className={uiTokens.jsonPrefill.sectionLabel}
            >
                Fichier JSON
            </FieldLabel>
            <Box className={uiTokens.jsonPrefill.documentShell}>
                <FileUploadField
                    disabled={disabled}
                    file={file ? { fileName: file.name, sizeBytes: file.size } : null}
                    inputId="entity-json-prefill-file"
                    onClear={onClear}
                    onError={onError}
                    onFileSelected={onFileSelected}
                    uploadPurpose={CONTENT_UPLOAD_PURPOSES.entityJsonPrefill}
                />
            </Box>
            <Box className={uiTokens.jsonPrefill.privacy}>
                <InlineIcon icon={ShieldCheck} className="mt-0.5 h-4 w-4 shrink-0" />
                <Text>
                    Le fichier est lu localement pour préparer le formulaire. Il n’est ni envoyé ni conservé.
                </Text>
            </Box>
        </Box>
    );
}

