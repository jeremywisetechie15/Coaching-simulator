"use client";

import { Download } from "lucide-react";
import { PERSONA_ROUTES } from "@/features/personas/domain/persona-routes";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, InlineIcon } from "@/lib/ui/atoms";
import { FileUploadField } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";

interface PersonaCvFieldProps {
    disabled?: boolean;
    file: { fileName: string; sizeBytes?: number | null } | null;
    onClear: () => void;
    onError?: (message: string) => void;
    onFileSelected: (file: File) => void;
    personaId?: string;
    showExistingDownload?: boolean;
    uploadProgress?: number | null;
}

export function PersonaCvField({
    disabled,
    file,
    onClear,
    onError,
    onFileSelected,
    personaId,
    showExistingDownload = false,
    uploadProgress,
}: PersonaCvFieldProps) {
    return (
        <Box>
            <FileUploadField
                disabled={disabled}
                file={file}
                inputId="persona-cv"
                onClear={onClear}
                onError={onError}
                onFileSelected={onFileSelected}
                uploadProgress={uploadProgress}
                uploadPurpose={CONTENT_UPLOAD_PURPOSES.personaCv}
            />
            {showExistingDownload && personaId && (
                <a
                    className={`${uiTokens.action.backLink} mt-2 text-[12px] text-[#5140F0]`}
                    href={PERSONA_ROUTES.api.cv(personaId)}
                >
                    <InlineIcon icon={Download} className="h-3.5 w-3.5" />
                    Télécharger le CV actuel
                </a>
            )}
        </Box>
    );
}
