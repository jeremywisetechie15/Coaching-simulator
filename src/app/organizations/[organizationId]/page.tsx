import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
import { OrganizationDetailPage, OrganizationsPage } from "@/features/organizations/components";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { getOrganizationDetail } from "@/features/organizations/server";
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
    let organization: OrganizationDetail | null = null;
    let accessDenied = false;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(`/auth?redirect=/organizations/${organizationId}`);
    }

    try {
        organization = await getOrganizationDetail(organizationId);
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
                organization={organization}
                profileValues={toProfileFormValues(profile)}
            />
        );
    }

    return (
        <OrganizationsPage
            accessDenied={accessDenied}
            initialOrganizations={[] as OrganizationListItem[]}
            profileValues={toProfileFormValues(profile)}
        />
    );
}
