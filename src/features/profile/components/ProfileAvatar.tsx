"use client";

import { Camera } from "lucide-react";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";

interface ProfileAvatarProps {
    avatarUrl: string | null;
    initials: string;
    isEditing: boolean;
    onAvatarChange: (file: File) => void;
}

export function ProfileAvatar({ avatarUrl, initials, isEditing, onAvatarChange }: ProfileAvatarProps) {
    const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            onAvatarChange(file);
        }

        event.target.value = "";
    };

    return (
        <Box className="group relative flex h-[102px] w-[102px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#A342F6] to-[#7A20EA] text-white shadow-[0_16px_28px_rgba(122,32,234,0.22)] ring-4 ring-white">
            {avatarUrl ? (
                <Box
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
            ) : (
                <Text as="span" className="relative z-10 text-[28px] font-semibold">
                    {initials}
                </Text>
            )}

            {isEditing && (
                <Box
                    as="label"
                    htmlFor="profile-avatar"
                    className="absolute inset-0 z-20 flex cursor-pointer items-center justify-center bg-[#171B2A]/45 opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
                    title="Modifier l'avatar"
                >
                    <InlineIcon icon={Camera} className="h-5 w-5 text-white" />
                    <Box
                        as="input"
                        id="profile-avatar"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleAvatarChange}
                    />
                </Box>
            )}
        </Box>
    );
}
