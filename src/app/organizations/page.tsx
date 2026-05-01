import { redirect } from "next/navigation";
import { ForbiddenError, UnauthorizedError } from "@/lib/server/errors";
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
            profileValues={toProfileFormValues(profile)}
        />
    );
}
