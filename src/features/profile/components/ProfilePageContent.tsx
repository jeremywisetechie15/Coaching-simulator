"use client";

import { useEffect, useState } from "react";
import { Box } from "@/lib/ui/atoms";
import { AlertMessage } from "@/lib/ui/molecules";
import type { ProfileEditableField, ProfileFormValues } from "@/features/profile/domain/profile";
import { ProfileDetailsCard } from "./ProfileDetailsCard";
import { ProfilePageHeader } from "./ProfilePageHeader";

interface ProfilePageContentProps {
    initialProfileValues: ProfileFormValues;
}

export function ProfilePageContent({ initialProfileValues }: ProfilePageContentProps) {
    const [profileValues, setProfileValues] = useState(initialProfileValues);
    const [draftValues, setDraftValues] = useState(initialProfileValues);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (avatarPreviewUrl) {
                URL.revokeObjectURL(avatarPreviewUrl);
            }
        };
    }, [avatarPreviewUrl]);

    const updateDraftValue = (field: ProfileEditableField, value: string) => {
        setDraftValues((currentValues) => ({
            ...currentValues,
            [field]: value,
        }));
    };

    const updateDraftAvatar = (file: File) => {
        setAvatarFile(file);
        setAvatarPreviewUrl(URL.createObjectURL(file));
    };

    const startEditing = () => {
        setDraftValues(profileValues);
        setAvatarFile(null);
        setAvatarPreviewUrl(null);
        setSaveError(null);
        setIsEditing(true);
    };

    const saveProfile = async () => {
        setIsSaving(true);
        setSaveError(null);

        try {
            let nextDraftValues = draftValues;

            if (avatarFile) {
                const formData = new FormData();
                formData.append("avatar", avatarFile);

                const uploadResponse = await fetch("/api/profile/avatar", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    const payload = await uploadResponse.json().catch(() => null);
                    throw new Error(payload?.error ?? "Impossible d'envoyer l'avatar.");
                }

                const payload = await uploadResponse.json();
                nextDraftValues = {
                    ...draftValues,
                    avatarPath: payload.avatar.path,
                    avatarUrl: payload.avatar.url,
                };
            }

            const response = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    avatarPath: nextDraftValues.avatarPath,
                    bio: nextDraftValues.bio,
                    firstName: nextDraftValues.firstName,
                    lastName: nextDraftValues.lastName,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error ?? "Impossible de sauvegarder le profil.");
            }

            const payload = await response.json();
            const nextProfileValues: ProfileFormValues = {
                ...nextDraftValues,
                avatarPath: payload.profile.avatarPath,
                avatarUrl: payload.profile.avatarUrl,
                bio: payload.profile.bio,
                email: payload.profile.email,
                firstName: payload.profile.firstName,
                lastName: payload.profile.lastName,
            };

            setProfileValues(nextProfileValues);
            setDraftValues(nextProfileValues);
            setAvatarFile(null);
            setAvatarPreviewUrl(null);
            setIsEditing(false);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : "Impossible de sauvegarder le profil.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <ProfilePageHeader
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onEdit={startEditing}
                    onSave={saveProfile}
                />
                {saveError && (
                    <Box className="mb-5">
                        <AlertMessage message={saveError} />
                    </Box>
                )}
                <ProfileDetailsCard
                    isEditing={isEditing}
                    values={
                        isEditing
                            ? { ...draftValues, avatarUrl: avatarPreviewUrl ?? draftValues.avatarUrl }
                            : profileValues
                    }
                    onAvatarChange={updateDraftAvatar}
                    onChange={updateDraftValue}
                />
            </Box>
        </Box>
    );
}
