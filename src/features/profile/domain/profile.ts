import type { PlatformRole } from "@/features/users/domain/users";
import type { ActivitySectorCode } from "./activity-sector";

export interface ProfileFormValues {
    activitySectorCode: ActivitySectorCode | null;
    avatarPath: string | null;
    avatarUrl: string | null;
    bio: string;
    email: string;
    firstName: string;
    lastName: string;
    platformRole: PlatformRole;
}

export type ProfileEditableField = "activitySectorCode" | "bio" | "firstName" | "lastName";

export interface ProfileView {
    activitySectorCode: ActivitySectorCode | null;
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
        activitySectorCode: profile.activitySectorCode,
        avatarPath: profile.avatarPath,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        platformRole: profile.platformRole,
    };
}
