import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { UsersPage } from "@/features/users/components";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { listOrganizations } from "@/features/organizations/server";
import type { UserListItem } from "@/features/users/domain/users";
import { listUsers } from "@/features/users/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getProfileInitials } from "@/features/profile/domain/profile-avatar";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Utilisateurs | MaiaCoach",
};

export default async function Page() {
    let profile;
    let organizations: OrganizationListItem[] = [];
    let users: UserListItem[] = [];

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/users");
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.users)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Utilisateurs"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    try {
        organizations = await listOrganizations();
        users = await listUsers();
    } catch (error) {
        if (!(error instanceof ForbiddenError)) {
            throw error;
        }

        return (
            <AccessDeniedPage
                activePrimaryItem="Utilisateurs"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    return (
        <UsersPage
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            initialUsers={users}
            organizations={organizations}
            platformRole={profileValues.platformRole}
        />
    );
}
