"use client";

import { Images, Link2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
    getPersonaAvatarPublicUrl,
    getPersonaInitials,
    isPersonaAvatarStoragePath,
} from "@/features/personas/domain/persona-list";
import { personaAvatarOptions } from "@/features/personas/data/persona-creation";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { Box, Button, FieldLabel, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";
import { ImageUploadField, SegmentedControl } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

const PERSONA_AVATAR_SOURCE = {
    library: "library",
    upload: "upload",
    url: "url",
} as const;

type PersonaAvatarSource =
    (typeof PERSONA_AVATAR_SOURCE)[keyof typeof PERSONA_AVATAR_SOURCE];

const avatarSourceOptions = [
    { icon: Upload, label: "Importer", value: PERSONA_AVATAR_SOURCE.upload },
    { icon: Images, label: "Avatars proposés", value: PERSONA_AVATAR_SOURCE.library },
    { icon: Link2, label: "URL", value: PERSONA_AVATAR_SOURCE.url },
] as const;

function getInitialSource(avatarUrl: string): PersonaAvatarSource {
    if (isPersonaAvatarStoragePath(avatarUrl)) return PERSONA_AVATAR_SOURCE.upload;
    if (personaAvatarOptions.some((avatar) => avatar.src === avatarUrl)) {
        return PERSONA_AVATAR_SOURCE.library;
    }
    if (avatarUrl.trim()) return PERSONA_AVATAR_SOURCE.url;
    return PERSONA_AVATAR_SOURCE.upload;
}

interface PersonaAvatarFieldProps {
    avatarFile: File | null;
    avatarUrl: string;
    disabled?: boolean;
    onAvatarFileChange: (file: File | null) => void;
    onAvatarUrlChange: (value: string) => void;
    onError?: (message: string) => void;
    personaName: string;
}

export function PersonaAvatarField({
    avatarFile,
    avatarUrl,
    disabled,
    onAvatarFileChange,
    onAvatarUrlChange,
    onError,
    personaName,
}: PersonaAvatarFieldProps) {
    const [source, setSource] = useState<PersonaAvatarSource>(() => getInitialSource(avatarUrl));
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
    const objectUrlRef = useRef<string | null>(null);
    const previewUrl = localPreviewUrl ?? getPersonaAvatarPublicUrl(avatarUrl);
    const hasAvatar = Boolean(avatarFile || avatarUrl.trim());

    useEffect(() => () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }
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

    function changeSource(nextSource: PersonaAvatarSource) {
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
        <Box className={uiTokens.personaAvatar.layout}>
            <Box className={uiTokens.personaAvatar.previewColumn}>
                <Box className={uiTokens.personaAvatar.preview}>
                    {previewUrl ? (
                        <Box
                            aria-label={personaName || "Avatar du persona"}
                            role="img"
                            className={uiTokens.personaAvatar.previewImage}
                            style={{ backgroundImage: `url(${previewUrl})` }}
                        />
                    ) : (
                        <Text className={uiTokens.personaAvatar.initials}>
                            {getPersonaInitials(personaName)}
                        </Text>
                    )}
                </Box>
                <Text className={uiTokens.personaAvatar.previewLabel}>Aperçu</Text>
                {hasAvatar && (
                    <Button
                        disabled={disabled}
                        onClick={clearAvatar}
                        className={uiTokens.personaAvatar.removeButton}
                    >
                        <InlineIcon icon={Trash2} className={uiTokens.personaAvatar.removeIcon} />
                        Retirer
                    </Button>
                )}
            </Box>

            <Box className={uiTokens.personaAvatar.controls}>
                <SegmentedControl
                    ariaLabel="Source de l'avatar"
                    disabled={disabled}
                    onChange={changeSource}
                    options={avatarSourceOptions}
                    value={source}
                />

                {source === PERSONA_AVATAR_SOURCE.upload && (
                    <ImageUploadField
                        disabled={disabled}
                        file={avatarFile}
                        helpText="Image JPG, PNG ou WebP, 10 Mo maximum."
                        inputId="persona-avatar-file"
                        label="Image depuis votre ordinateur"
                        onClear={clearAvatar}
                        onError={onError}
                        onFileSelected={selectFile}
                        storedPath={isPersonaAvatarStoragePath(avatarUrl) ? avatarUrl : ""}
                        uploadPurpose={CONTENT_UPLOAD_PURPOSES.personaAvatar}
                    />
                )}

                {source === PERSONA_AVATAR_SOURCE.library && (
                    <Box className={uiTokens.personaAvatar.gallery}>
                        {personaAvatarOptions.map((avatar) => {
                            const isSelected = avatarUrl === avatar.src;

                            return (
                                <Button
                                    key={avatar.id}
                                    aria-label={avatar.alt}
                                    aria-pressed={isSelected}
                                    disabled={disabled}
                                    onClick={() => selectUrl(avatar.src)}
                                    className={cn(
                                        uiTokens.personaAvatar.galleryOption,
                                        isSelected
                                            ? uiTokens.personaAvatar.galleryOptionActive
                                            : uiTokens.personaAvatar.galleryOptionIdle,
                                    )}
                                >
                                    <Box
                                        aria-label={avatar.alt}
                                        role="img"
                                        className={uiTokens.personaAvatar.galleryImage}
                                        style={{ backgroundImage: `url(${avatar.src})` }}
                                    />
                                </Button>
                            );
                        })}
                    </Box>
                )}

                {source === PERSONA_AVATAR_SOURCE.url && (
                    <Box>
                        <FieldLabel htmlFor="persona-avatar-url" className={uiTokens.form.subLabel}>
                            URL image de l&apos;avatar
                        </FieldLabel>
                        <TextInput
                            density="sm"
                            disabled={disabled}
                            hasLeadingIcon={false}
                            id="persona-avatar-url"
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
