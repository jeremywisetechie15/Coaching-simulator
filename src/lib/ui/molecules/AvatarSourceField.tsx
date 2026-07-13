"use client";

import { Images, Link2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ContentUploadPurpose } from "@/lib/uploads/content-upload";
import { Box, Button, FieldLabel, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
import { ImageUploadField } from "./ImageUploadField";
import { SegmentedControl } from "./SegmentedControl";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const AVATAR_SOURCE = {
    library: "library",
    upload: "upload",
    url: "url",
} as const;

type AvatarSource = (typeof AVATAR_SOURCE)[keyof typeof AVATAR_SOURCE];

const avatarSourceOptions = [
    { icon: Upload, label: "Importer", value: AVATAR_SOURCE.upload },
    { icon: Images, label: "Avatars proposés", value: AVATAR_SOURCE.library },
    { icon: Link2, label: "URL", value: AVATAR_SOURCE.url },
] as const;

export interface AvatarLibraryOption {
    id: string;
    label: string;
    src: string;
}

interface AvatarSourceFieldProps {
    avatarFile: File | null;
    avatarUrl: string;
    disabled?: boolean;
    displayName: string;
    entityLabel: string;
    inputIdPrefix: string;
    isStoredPath: (value: string) => boolean;
    libraryOptions: readonly AvatarLibraryOption[];
    onAvatarFileChange: (file: File | null) => void;
    onAvatarUrlChange: (value: string) => void;
    onError?: (message: string) => void;
    resolvePreviewUrl: (value: string) => string | null;
    uploadPurpose: ContentUploadPurpose;
}

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "IA";
    return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function getInitialSource(
    avatarUrl: string,
    isStoredPath: AvatarSourceFieldProps["isStoredPath"],
    libraryOptions: AvatarSourceFieldProps["libraryOptions"],
): AvatarSource {
    if (isStoredPath(avatarUrl)) return AVATAR_SOURCE.upload;
    if (libraryOptions.some((avatar) => avatar.src === avatarUrl)) return AVATAR_SOURCE.library;
    if (avatarUrl.trim()) return AVATAR_SOURCE.url;
    return AVATAR_SOURCE.upload;
}

export function AvatarSourceField({
    avatarFile,
    avatarUrl,
    disabled,
    displayName,
    entityLabel,
    inputIdPrefix,
    isStoredPath,
    libraryOptions,
    onAvatarFileChange,
    onAvatarUrlChange,
    onError,
    resolvePreviewUrl,
    uploadPurpose,
}: AvatarSourceFieldProps) {
    const [source, setSource] = useState<AvatarSource>(() => (
        getInitialSource(avatarUrl, isStoredPath, libraryOptions)
    ));
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const previewUrl = localPreviewUrl ?? resolvePreviewUrl(avatarUrl);
    const hasAvatar = Boolean(avatarFile || avatarUrl.trim());

    useEffect(() => () => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    }, []);

    function clearLocalPreview() {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        setLocalPreviewUrl(null);
    }

    function clearAvatar() {
        clearLocalPreview();
        onAvatarFileChange(null);
        onAvatarUrlChange("");
    }

    function changeSource(nextSource: AvatarSource) {
        if (nextSource === source) return;
        clearAvatar();
        setSource(nextSource);
    }

    function selectFile(file: File) {
        clearLocalPreview();
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        setLocalPreviewUrl(objectUrl);
        onAvatarUrlChange("");
        onAvatarFileChange(file);
    }

    function selectUrl(value: string) {
        clearLocalPreview();
        onAvatarFileChange(null);
        onAvatarUrlChange(value);
    }

    return (
        <Box className={uiTokens.avatarSource.layout}>
            <Box className={uiTokens.avatarSource.previewColumn}>
                <Box className={uiTokens.avatarSource.preview}>
                    {previewUrl ? (
                        <Box
                            aria-label={displayName || `Avatar du ${entityLabel}`}
                            role="img"
                            className={uiTokens.avatarSource.previewImage}
                            style={{ backgroundImage: `url(${previewUrl})` }}
                        />
                    ) : (
                        <Text className={uiTokens.avatarSource.initials}>{getInitials(displayName)}</Text>
                    )}
                </Box>
                <Text className={uiTokens.avatarSource.previewLabel}>Aperçu</Text>
                {hasAvatar && (
                    <Button
                        disabled={disabled}
                        onClick={clearAvatar}
                        className={uiTokens.avatarSource.removeButton}
                    >
                        <InlineIcon icon={Trash2} className={uiTokens.avatarSource.removeIcon} />
                        Retirer
                    </Button>
                )}
            </Box>

            <Box className={uiTokens.avatarSource.controls}>
                <SegmentedControl
                    ariaLabel="Source de l'avatar"
                    disabled={disabled}
                    onChange={changeSource}
                    options={avatarSourceOptions}
                    value={source}
                />

                {source === AVATAR_SOURCE.upload && (
                    <ImageUploadField
                        disabled={disabled}
                        file={avatarFile}
                        inputId={`${inputIdPrefix}-file`}
                        label="Image depuis votre ordinateur"
                        onClear={clearAvatar}
                        onError={onError}
                        onFileSelected={selectFile}
                        storedPath={isStoredPath(avatarUrl) ? avatarUrl : ""}
                        uploadPurpose={uploadPurpose}
                    />
                )}

                {source === AVATAR_SOURCE.library && (
                    <Box className={uiTokens.avatarSource.gallery}>
                        {libraryOptions.map((avatar) => {
                            const isSelected = avatarUrl === avatar.src;

                            return (
                                <Button
                                    key={avatar.id}
                                    aria-label={avatar.label}
                                    aria-pressed={isSelected}
                                    disabled={disabled}
                                    onClick={() => selectUrl(avatar.src)}
                                    className={cn(
                                        uiTokens.avatarSource.galleryOption,
                                        isSelected
                                            ? uiTokens.avatarSource.galleryOptionActive
                                            : uiTokens.avatarSource.galleryOptionIdle,
                                    )}
                                >
                                    <Box
                                        aria-label={avatar.label}
                                        role="img"
                                        className={uiTokens.avatarSource.galleryImage}
                                        style={{ backgroundImage: `url(${avatar.src})` }}
                                    />
                                </Button>
                            );
                        })}
                    </Box>
                )}

                {source === AVATAR_SOURCE.url && (
                    <Box>
                        <FieldLabel htmlFor={`${inputIdPrefix}-url`} className={uiTokens.form.subLabel}>
                            URL image de l&apos;avatar
                        </FieldLabel>
                        <TextInput
                            density="sm"
                            disabled={disabled}
                            hasLeadingIcon={false}
                            id={`${inputIdPrefix}-url`}
                            onChange={(event) => selectUrl(event.target.value)}
                            placeholder="https://..."
                            type="url"
                            value={avatarUrl}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
