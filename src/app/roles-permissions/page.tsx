import { notFound, redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/server/errors";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { RolesPermissionsPage } from "@/features/permissions/components";
import { SHOW_ROLES_PERMISSIONS_NAVIGATION } from "@/features/permissions/domain";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Rôles & Permissions | MaiaCoach",
};

export default async function Page() {
    if (!SHOW_ROLES_PERMISSIONS_NAVIGATION) {
        notFound();
    }

    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/roles-permissions");
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.permissions)) {
        return (
            <AccessDeniedPage
                activeAccountItem="Rôles & Permissions"
                profileValues={profileValues}
            />
        );
    }

    return (
        <RolesPermissionsPage
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            platformRole={profileValues.platformRole}
        />
    );
}
