import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { OrganizationGroupDetailPage } from "@/features/organizations/components";
import { getOrganizationGroupPageData, type OrganizationGroupPageData } from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { ForbiddenError, NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{
        groupId: string;
        organizationId: string;
    }>;
    searchParams?: Promise<{ returnTo?: string; tab?: string }>;
}

export const metadata = {
    title: "Détail du groupe | MaiaCoach",
};

export default async function Page({ params, searchParams }: PageProps) {
    const { groupId, organizationId } = await params;
    const { returnTo, tab } = searchParams ? await searchParams : {};
    let groupData: OrganizationGroupPageData;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            const groupHref = tab
                ? `/organizations/${organizationId}/groups/${groupId}?tab=${encodeURIComponent(tab)}`
                : `/organizations/${organizationId}/groups/${groupId}`;
            redirect(buildAuthRedirectHref(withReturnTo(groupHref, returnTo)));
        }

        throw error;
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.organizations)) {
        return <AccessDeniedPage activePrimaryItem="Organisations" profileValues={profileValues} />;
    }

    try {
        groupData = await getOrganizationGroupPageData(organizationId, groupId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        if (error instanceof ForbiddenError) {
            return <AccessDeniedPage activePrimaryItem="Organisations" profileValues={profileValues} />;
        }

        throw error;
    }

    return (
        <OrganizationGroupDetailPage
            groupData={groupData}
            profileValues={profileValues}
        />
    );
}
