"use client";

import {
    CONTENT_UPLOAD_PURPOSES,
    getStoragePathFileName,
    type ContentUploadPurpose,
} from "@/lib/uploads/content-upload";
import { Box, FieldLabel, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import { FileUploadField } from "./FileUploadField";

interface ImageUploadFieldProps {
    disabled?: boolean;
    file: File | null;
    helpText: string;
    inputId: string;
    label: string;
    onClear: () => void;
    onError?: (message: string) => void;
    onFileSelected: (file: File) => void;
    optional?: boolean;
    storedPath: string;
    uploadPurpose?: ContentUploadPurpose;
}

export function ImageUploadField({
    disabled,
    file,
    helpText,
    inputId,
    label,
    onClear,
    onError,
    onFileSelected,
    optional = true,
    storedPath,
    uploadPurpose = CONTENT_UPLOAD_PURPOSES.sessionBackground,
}: ImageUploadFieldProps) {
    const preview = file
        ? { fileName: file.name, sizeBytes: file.size }
        : storedPath
          ? { fileName: getStoragePathFileName(storedPath), sizeBytes: null }
          : null;

    return (
        <Box>
            <FieldLabel htmlFor={inputId} className={uiTokens.form.subLabel}>
                {label}{" "}
                {optional && <span className={uiTokens.text.muted}>(optionnel)</span>}
            </FieldLabel>
            <Text className={cn("mb-2 text-[12px] font-medium", uiTokens.text.muted)}>
                {helpText}
            </Text>
            <FileUploadField
                disabled={disabled}
                file={preview}
                inputId={inputId}
                onClear={onClear}
                onError={onError}
                onFileSelected={onFileSelected}
                uploadPurpose={uploadPurpose}
            />
        </Box>
    );
}
