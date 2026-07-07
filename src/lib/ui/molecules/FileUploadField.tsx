"use client";

import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import type { ContentUploadPurpose } from "@/lib/uploads/content-upload";
import {
    formatUploadFileSize,
    getContentUploadAccept,
    validateContentUploadFile,
} from "@/lib/uploads/content-upload";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface SelectedFilePreview {
    fileName: string;
    sizeBytes?: number | null;
}

interface FileUploadFieldProps {
    className?: string;
    disabled?: boolean;
    file?: SelectedFilePreview | null;
    inputId?: string;
    onClear?: () => void;
    onError?: (message: string) => void;
    onFileSelected: (file: File) => void;
    uploadPurpose?: ContentUploadPurpose;
}

export function FileUploadField({
    className,
    disabled,
    file,
    inputId,
    onClear,
    onError,
    onFileSelected,
    uploadPurpose,
}: FileUploadFieldProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const sizeLabel = formatUploadFileSize(file?.sizeBytes);

    function clearNativeInput() {
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    }

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.currentTarget.files?.[0];
        if (!selectedFile) return;

        setUploadError(null);

        const validationMessage = validateContentUploadFile(selectedFile, uploadPurpose);
        if (validationMessage) {
            setUploadError(validationMessage);
            onError?.(validationMessage);
            clearNativeInput();
            return;
        }

        onFileSelected(selectedFile);
        clearNativeInput();
    }

    function handleClear() {
        setUploadError(null);
        onClear?.();
        clearNativeInput();
    }

    return (
        <Box className={cn("space-y-2", className)}>
            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={getContentUploadAccept(uploadPurpose)}
                disabled={disabled}
                onChange={handleFileChange}
                className="sr-only"
            />

            {file ? (
                <Box className={cn("flex min-h-11 items-center justify-between gap-3", uiTokens.upload.fileRow)}>
                    <Box className="flex min-w-0 items-center gap-2.5">
                        <InlineIcon icon={FileText} className={cn("h-4 w-4 shrink-0", uiTokens.text.primary)} />
                        <Box className="min-w-0">
                            <Text className={cn("truncate text-[13px] font-bold", uiTokens.text.heading)}>
                                {file.fileName}
                            </Text>
                            {sizeLabel && (
                                <Text className={cn("text-[12px] font-medium", uiTokens.text.muted)}>
                                    {sizeLabel}
                                </Text>
                            )}
                        </Box>
                    </Box>
                    <Box className="flex shrink-0 items-center gap-1.5">
                        <InlineIcon icon={CheckCircle2} className={cn("h-4 w-4", uiTokens.text.success)} />
                        {onClear && (
                            <Button
                                aria-label="Retirer le fichier"
                                disabled={disabled}
                                onClick={handleClear}
                                className={uiTokens.action.iconButtonGhost}
                            >
                                <InlineIcon icon={X} className="h-4 w-4" />
                            </Button>
                        )}
                    </Box>
                </Box>
            ) : (
                <Button
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    className={cn(
                        "flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold transition",
                        uiTokens.upload.dropButton,
                        disabled ? uiTokens.upload.dropButtonDisabled : uiTokens.upload.dropButtonEnabled,
                    )}
                >
                    <InlineIcon icon={Upload} className="h-4 w-4" />
                    Choisir un fichier
                </Button>
            )}

            {uploadError && (
                <Text className={cn("text-[12px] font-semibold", uiTokens.text.danger)}>
                    {uploadError}
                </Text>
            )}
        </Box>
    );
}
