import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { OrganizationsPage } from "@/features/organizations/components";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { listOrganizations } from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";

export const metadata = {
    title: "Organisations | MaiaCoach",
};

export default async function Page() {
    let profile;
    let organizations: OrganizationListItem[] = [];
    let accessDenied = false;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/organizations");
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.organizations)) {
        return <AccessDeniedPage activePrimaryItem="Organisations" profileValues={profileValues} />;
    }

    try {
        organizations = await listOrganizations();
    } catch (error) {
        if (!(error instanceof ForbiddenError)) {
            throw error;
        }

        accessDenied = true;
    }

    return (
        <OrganizationsPage
            accessDenied={accessDenied}
            initialOrganizations={organizations}
            profileValues={profileValues}
        />
    );
}
