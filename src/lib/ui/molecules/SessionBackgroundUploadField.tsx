"use client";

import { getStoragePathFileName, CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, FieldLabel, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { FileUploadField } from "./FileUploadField";

interface SessionBackgroundUploadFieldProps {
    disabled?: boolean;
    file: File | null;
    inputId: string;
    onClear: () => void;
    onError?: (message: string) => void;
    onFileSelected: (file: File) => void;
    storedPath: string;
}

export function SessionBackgroundUploadField({
    disabled,
    file,
    inputId,
    onClear,
    onError,
    onFileSelected,
    storedPath,
}: SessionBackgroundUploadFieldProps) {
    const preview = file
        ? { fileName: file.name, sizeBytes: file.size }
        : storedPath
          ? { fileName: getStoragePathFileName(storedPath), sizeBytes: null }
          : null;

    return (
        <Box>
            <FieldLabel htmlFor={inputId} className={uiTokens.form.subLabel}>
                Image de fond de la session <span className={uiTokens.text.muted}>(optionnel)</span>
            </FieldLabel>
            <Text className={cn("mb-2 text-[12px] font-medium", uiTokens.text.muted)}>
                Image JPG, PNG ou WebP, 10 Mo maximum.
            </Text>
            <FileUploadField
                disabled={disabled}
                file={preview}
                inputId={inputId}
                onClear={onClear}
                onError={onError}
                onFileSelected={onFileSelected}
                uploadPurpose={CONTENT_UPLOAD_PURPOSES.sessionBackground}
            />
        </Box>
    );
}
