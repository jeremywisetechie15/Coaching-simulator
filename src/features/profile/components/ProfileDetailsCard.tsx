import { Box, CardSurface } from "@/lib/ui/atoms";
import type { ProfileEditableField, ProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileField } from "./ProfileField";
import { ProfilePasswordControl } from "./ProfilePasswordControl";
import { ProfileSectionTitle } from "./ProfileSectionTitle";

interface ProfileDetailsCardProps {
    isEditing: boolean;
    onAvatarChange: (file: File) => void;
    onChangePassword: () => void;
    onChange: (field: ProfileEditableField, value: string) => void;
    values: ProfileFormValues;
}

export function ProfileDetailsCard({
    isEditing,
    onAvatarChange,
    onChange,
    onChangePassword,
    values,
}: ProfileDetailsCardProps) {
    return (
        <CardSurface className="rounded-[18px] border border-[#E1E4EB] px-6 py-6 shadow-none md:px-9">
            <ProfileSectionTitle title="Informations de base" />

            <Box className="grid gap-7 pt-8 md:grid-cols-[118px_minmax(0,1fr)]">
                <Box className="flex justify-center md:justify-start">
                    <ProfileAvatar
                        avatarUrl={values.avatarUrl}
                        initials={getProfileInitials(values)}
                        isEditing={isEditing}
                        onAvatarChange={onAvatarChange}
                    />
                </Box>

                <Box className="space-y-5">
                    <ProfileField
                        id="first-name"
                        label="Prénom"
                        value={values.firstName}
                        readOnly={!isEditing}
                        onChange={(event) => onChange("firstName", event.target.value)}
                        required
                    />
                    <ProfileField
                        id="last-name"
                        label="Nom"
                        value={values.lastName}
                        readOnly={!isEditing}
                        onChange={(event) => onChange("lastName", event.target.value)}
                        required
                    />
                    <ProfileField
                        id="bio"
                        label="Bio"
                        value={values.bio}
                        readOnly={!isEditing}
                        onChange={(event) => onChange("bio", event.target.value)}
                        multiline
                    />
                </Box>
            </Box>

            <Box className="pt-12">
                <ProfileSectionTitle title="Identifiants de connexion" />
                <Box className="grid gap-5 pt-8 md:grid-cols-[118px_minmax(0,1fr)]">
                    <Box />
                    <Box className="space-y-5">
                        <ProfileField id="email-login" label="Email" value={values.email} required />
                        <ProfilePasswordControl onChangePassword={onChangePassword} />
                    </Box>
                </Box>
            </Box>
        </CardSurface>
    );
}
