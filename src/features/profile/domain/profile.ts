import type { PlatformRole } from "@/features/users/domain/users";

export interface ProfileFormValues {
    avatarPath: string | null;
    avatarUrl: string | null;
    bio: string;
    email: string;
    firstName: string;
    lastName: string;
    platformRole: PlatformRole;
}

export type ProfileEditableField = Exclude<keyof ProfileFormValues, "platformRole">;

export interface ProfileView {
    avatarPath: string | null;
    avatarUrl: string | null;
    bio: string;
    email: string;
    firstName: string;
    lastName: string;
    platformRole: PlatformRole;
}

export function toProfileFormValues(profile: ProfileView): ProfileFormValues {
    return {
        avatarPath: profile.avatarPath,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        platformRole: profile.platformRole,
    };
}
