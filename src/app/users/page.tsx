import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
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

    try {
        organizations = await listOrganizations();
        users = await listUsers();
    } catch (error) {
        if (!(error instanceof ForbiddenError)) {
            throw error;
        }
    }

    const profileValues = toProfileFormValues(profile);

    return (
        <UsersPage
            avatarUrl={profileValues.avatarUrl}
            initials={getProfileInitials(profileValues)}
            initialUsers={users}
            organizations={organizations}
        />
    );
}
