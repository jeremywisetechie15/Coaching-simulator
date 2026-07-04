import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canAccessAppRoute,
} from "@/features/auth/domain/access-control";
import { OrganizationDetailPage, OrganizationsPage } from "@/features/organizations/components";
import type {
    OrganizationDetail,
    OrganizationEvaluationRow,
    OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    getOrganizationDetail,
    listOrganizationEvaluations,
    listOrganizationRoleplays,
} from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";

interface PageProps {
    params: Promise<{
        organizationId: string;
    }>;
    searchParams: Promise<{
        edit?: string;
    }>;
}

export default async function Page({ params, searchParams }: PageProps) {
    const { organizationId } = await params;
    const { edit } = await searchParams;
    let profile;
    let evaluations: OrganizationEvaluationRow[] = [];
    let organization: OrganizationDetail | null = null;
    let roleplays: OrganizationRoleplayRow[] = [];
    let accessDenied = false;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/organizations/${organizationId}`);
    }

    const profileValues = toProfileFormValues(profile);

    if (!canAccessAppRoute(profileValues.platformRole, APP_NAVIGATION_RESOURCE.organizations)) {
        return <AccessDeniedPage activePrimaryItem="Organisations" profileValues={profileValues} />;
    }

    try {
        [organization, roleplays, evaluations] = await Promise.all([
            getOrganizationDetail(organizationId),
            listOrganizationRoleplays(organizationId),
            listOrganizationEvaluations(organizationId),
        ]);
    } catch (error) {
        if (!(error instanceof ForbiddenError)) {
            throw error;
        }

        accessDenied = true;
    }

    if (organization) {
        return (
            <OrganizationDetailPage
                initialIsEditing={edit === "1" || edit === "true"}
                evaluations={evaluations}
                organization={organization}
                profileValues={profileValues}
                roleplays={roleplays}
            />
        );
    }

    return (
        <OrganizationsPage
            accessDenied={accessDenied}
            initialOrganizations={[] as OrganizationListItem[]}
            profileValues={profileValues}
        />
    );
}
