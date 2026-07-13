"use client";

import {
    getCoachAvatarPublicUrl,
    isCoachAvatarStoragePath,
} from "@/features/coaches/domain/coach-list";
import { coachAvatarOptions } from "@/features/coaches/data/coachOptions";
import { CONTENT_UPLOAD_PURPOSES } from "@/lib/uploads/content-upload";
import { AvatarSourceField } from "@/lib/ui/molecules";

interface CoachAvatarFieldProps {
    avatarFile: File | null;
    avatarUrl: string;
    coachName: string;
    disabled?: boolean;
    onAvatarFileChange: (file: File | null) => void;
    onAvatarUrlChange: (value: string) => void;
    onError?: (message: string) => void;
}

const libraryOptions = coachAvatarOptions.map((avatar) => ({
    id: avatar.id,
    label: avatar.name,
    src: avatar.src,
}));

export function CoachAvatarField({
    avatarFile,
    avatarUrl,
    coachName,
    disabled,
    onAvatarFileChange,
    onAvatarUrlChange,
    onError,
}: CoachAvatarFieldProps) {
    return (
        <AvatarSourceField
            avatarFile={avatarFile}
            avatarUrl={avatarUrl}
            disabled={disabled}
            displayName={coachName}
            entityLabel="coach"
            inputIdPrefix="coach-avatar"
            isStoredPath={isCoachAvatarStoragePath}
            libraryOptions={libraryOptions}
            onAvatarFileChange={onAvatarFileChange}
            onAvatarUrlChange={onAvatarUrlChange}
            onError={onError}
            resolvePreviewUrl={getCoachAvatarPublicUrl}
            uploadPurpose={CONTENT_UPLOAD_PURPOSES.coachAvatar}
        />
    );
}
