"use client";

import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { ImageUploadField } from "./ImageUploadField";

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
    return (
        <ImageUploadField
            disabled={disabled}
            file={file}
            helpText="Image JPG, PNG ou WebP, 10 Mo maximum."
            inputId={inputId}
            label="Image de fond de la session"
            onClear={onClear}
            onError={onError}
            onFileSelected={onFileSelected}
            storedPath={storedPath}
            uploadPurpose={CONTENT_UPLOAD_PURPOSES.sessionBackground}
        />
    );
}
