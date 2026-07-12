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
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{ returnTo?: string }>;
}

export const metadata = {
    title: "Organisations | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;
    let organizations: OrganizationListItem[] = [];
    let accessDenied = false;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo("/organizations", returnTo)));
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
